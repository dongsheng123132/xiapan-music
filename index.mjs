/**
 * 虾盘云音乐 · DeepSeek Harness 插件（host-only v1）
 *
 * 注册两件事：
 * 1. 内置技能 `skills/xiapan-music`（FileSystemSkillProvider，随包自包含）
 * 2. 工具 `xiapan_music`：把动作转成内置技能脚本的子进程调用，输出脱敏后回给模型
 *
 * 设计约束（见 docs/PLAN.md §3 §5 §7）：
 * - 协议实现只在 src/core（由 scripts/sync-core.mjs 同步进技能包），本文件不重写 HTTP 协议
 * - 任何日志/输出/报错都不得包含完整 Key（只允许前 8 位）
 * - 付费提交不自动重试；一次调用只提交一次；`--confirm` 必须由用户确认后显式传入
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { FileSystemSkillProvider } from '@deepseek-ai/dsh-skill-filesystem'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-xiapan-music'

/**
 * `credentials` 不放进 inject：部分 profile（如 0.2.x 的 headless 模板）会禁用
 * 凭据服务，强制注入会让插件永远 pending、工具根本不出现。运行时按需
 * `ctx.get('credentials')` 探测：没有凭据服务时插件照常工作（脚本自兜底设备 Key）。
 */
export const inject = ['skills', 'subprocess', 'tools']

/** 虾盘云 Key 的凭据引用名（值来自 $DSH_HOME/.credentials.yaml 的 refs 或继承环境变量）。 */
const API_KEY_REF = credentialRef('XIAPAN_API_KEY')
/** 出整歌最长 11 分钟：提交 + 轮询（实测 60-90 秒，留足余量）。 */
const TOOL_TIMEOUT_MS = 660_000
/** 导流来源标记，写进脚本的 nextSteps UTM。 */
const SOURCE = 'dsh'

const PACKAGE_ROOT = fileURLToPath(new URL('.', import.meta.url))
const SKILL_ROOT = join(PACKAGE_ROOT, 'skills')
const SKILL_DIR = join(SKILL_ROOT, 'xiapan-music')
const SCRIPT_DIR = join(SKILL_DIR, 'scripts')

/** 动作 → 内置技能脚本（按顺序取第一个存在的文件，兼容脚本命名微调）。 */
const ACTION_SCRIPTS = Object.freeze({
  song: ['song.mjs'],
  instrumental: ['bgm.mjs'],
  lyrics: ['lyrics.mjs'],
  balance: ['balance.mjs'],
})

/** 模型不得传进 argv 的参数：Key、输出模式都由插件统一控制。 */
const FORBIDDEN_ARGV_FLAGS = ['--json', '--key', '--env-file']

const LINKS = Object.freeze({
  board: 'https://tu.u-claw.org.cn/?utm_source=dsh&utm_medium=plugin&utm_campaign=xiapan-music',
  recharge: 'https://api.u-claw.org.cn/recharge',
  console: 'https://api.u-claw.org.cn',
  deviceKeyFile: join(homedir(), '.uking', 'device.json'),
})

const dev = process.env.NODE_ENV === 'development'

/** 只读诊断日志：不打完整 Key。 */
function logDebug(ctx, message) {
  if (dev) ctx.logger?.debug?.(message)
}

/**
 * 把疑似 Key 的文本脱敏：已知值全量替换；`sk-` 前缀只留前 8 位。
 * @param {string} text 原始文本
 * @param {string} [secret] 本次解析到的 Key 值
 * @returns {string} 可安全回给模型/日志的文本
 */
export function redactSecrets(text, secret) {
  if (typeof text !== 'string') return ''
  let safe = text
  if (typeof secret === 'string' && secret.length >= 6 && safe.includes(secret)) {
    safe = safe.split(secret).join('[REDACTED]')
  }
  return safe.replace(/\bsk-[A-Za-z0-9_-]{6,}/g, (match) => `${match.slice(0, 8)}***`)
}

/**
 * 读取可选的凭据服务；宿主没有该服务时返回 undefined（不能让它阻塞插件加载）。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文
 * @returns {object | undefined} 凭据服务实例
 */
function credentialsService(ctx) {
  try {
    return typeof ctx.get === 'function' ? ctx.get('credentials') : undefined
  } catch {
    return undefined
  }
}

/**
 * 解析显式 Key，顺序：DSH 凭据服务 > 宿主继承环境变量 XIAPAN_API_KEY。
 * 都没有时返回 undefined，让脚本兜底本机设备 Key（~/.uking/device.json）。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文
 * @returns {Promise<string | undefined>} 完整 Key（只在内存/子进程 env 里流转）
 */
async function resolveApiKey(ctx) {
  const credentials = credentialsService(ctx)
  if (credentials !== undefined && typeof credentials.resolve === 'function') {
    try {
      const resolved = await credentials.resolve(API_KEY_REF)
      if (typeof resolved?.value === 'string' && resolved.value.length > 0) return resolved.value
    } catch {
      // 凭据服务不可用/未配置：继续尝试环境变量与设备 Key 兜底。
    }
  }
  const fromEnv = process.env.XIAPAN_API_KEY
  return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : undefined
}

/** 解析本次要用的动作脚本；缺失时给出可执行的修复提示。 */
function resolveScript(action) {
  const candidates = ACTION_SCRIPTS[action]
  if (candidates === undefined) throw new Error(`xiapan_music 不支持动作 ${JSON.stringify(action)}`)
  const found = candidates.map((file) => join(SCRIPT_DIR, file)).find((path) => existsSync(path))
  if (found === undefined) {
    throw new Error(
      `没有找到动作 ${action} 的脚本（期望 ${candidates.map((file) => join(SCRIPT_DIR, file)).join(' 或 ')}）。`
      + ' 说明插件包缺少 skills/xiapan-music/scripts/，请重新安装 dsh-xiapan-music。',
    )
  }
  return found
}

/** 读取收集型 stdio 的文本。 */
function collectedText(reader) {
  if (reader === undefined) return { text: '', lossy: false }
  const output = reader.readFrom(0)
  return { text: output.text.trim(), lossy: output.lossy === true }
}

/** 优先用与宿主同一个 Node，再退回 PATH 上的 node。 */
async function resolveNode(ctx, signal) {
  for (const command of [process.execPath, 'node']) {
    try {
      return await ctx.subprocess.resolveExecutable(command, undefined, signal)
    } catch (error) {
      if (signal?.aborted) throw error
    }
  }
  return process.execPath
}

/** 目标工作目录：模型会话工作区优先，退回宿主进程 cwd。 */
function workingDirectory(exec) {
  const cwd = exec?.agent?.cwd
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd()
}

/** 该 argv 是否已带某参数（支持 `--x v` 与 `--x=v` 两种写法）。 */
function hasFlag(argv, flag) {
  return argv.some((value) => value === flag || value.startsWith(`${flag}=`))
}

/** 解析 argv，拒绝越权参数：Key 只能来自凭据系统，不允许出现在对话里。 */
function sanitizeArgv(ctx, argv, action, secret) {
  if (!Array.isArray(argv)) throw new Error('xiapan_music 的 argv 必须是字符串数组')
  const cleaned = argv.map((value) => {
    if (typeof value !== 'string') throw new Error('xiapan_music 的 argv 只能包含字符串')
    return value
  })
  for (const value of cleaned) {
    const flag = value.split('=', 1)[0]
    if (FORBIDDEN_ARGV_FLAGS.includes(flag)) {
      throw new Error(
        `xiapan_music 的 argv 不能包含 ${flag}：Key 由 DSH 凭据系统注入，输出固定为 JSON。`,
      )
    }
    if (typeof secret === 'string' && secret.length >= 6 && value.includes(secret)) {
      throw new Error('xiapan_music 的 argv 不能包含虾盘云 Key；请把它存进 DSH 凭据 XIAPAN_API_KEY。')
    }
  }
  logDebug(ctx, `xiapan_music action=${action} argv=${cleaned.length} 项`)
  return cleaned
}

/** 脚本缺失/输出异常时的统一错误。 */
function scriptFailure(action, stdout, stderr, exitCode) {
  const detail = stderr.length > 0 ? stderr : stdout.length > 0 ? stdout : '脚本没有输出'
  return new Error(`虾盘云音乐 ${action} 执行失败（退出码 ${exitCode}）：${detail}`)
}

/**
 * `status` 动作：默认完全本地、零费用地报告插件与凭据就绪情况。
 * 带 taskId 时转成 `song.mjs --resume-task <id>` 续查历史任务（不重新提交、不扣费）。
 */
function statusPayload(ctx, resolvedKey) {
  const scripts = {}
  for (const [action, candidates] of Object.entries(ACTION_SCRIPTS)) {
    const path = candidates.map((file) => join(SCRIPT_DIR, file)).find((candidate) => existsSync(candidate))
    scripts[action] = {
      script: path === undefined ? null : path.slice(SCRIPT_DIR.length + 1),
      ready: path !== undefined,
    }
  }
  return {
    ok: true,
    plugin: {
      name: 'dsh-xiapan-music',
      version: '0.1.0',
      skillDirectory: SKILL_DIR,
      skillManifestPresent: existsSync(join(SKILL_DIR, 'SKILL.md')),
      scripts,
    },
    credentials: {
      credentialsServiceAvailable: credentialsService(ctx) !== undefined,
      xiapanApiKeyConfigured: resolvedKey !== undefined,
      xiapanApiKeySource: resolvedKey === undefined ? 'none' : 'DSH 凭据 XIAPAN_API_KEY（refs 或继承环境变量）',
      deviceKeyFilePresent: existsSync(LINKS.deviceKeyFile),
      hint:
        resolvedKey === undefined
          ? '未配置 XIAPAN_API_KEY；若本机有虾盘云设备 Key（~/.uking/device.json），脚本会自兜底，否则请先去 https://api.u-claw.org.cn 领 Key。'
          : '已配置 XIAPAN_API_KEY。',
    },
    runtime: {
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    costHint: '出整歌约 ¥2.4/次（一次 2 首完整歌，60-90 秒）；纯音乐 BGM 约 ¥1/首；歌词 ≈¥0.01；查余额免费。',
    links: LINKS,
    queryTask: '查历史任务：action=status + argv=["--resume-task","<taskId>"]（不重新提交、不扣费）。',
  }
}

/** 组装真正发给脚本的 argv：调用方参数 + 来源标记 + JSON 输出。 */
function scriptArgv(safeArgv) {
  const argv = [...safeArgv]
  if (!hasFlag(argv, '--source')) argv.push('--source', SOURCE)
  argv.push('--json')
  return argv
}

/** `status` 带 taskId 时转成 song.mjs 的续查参数。 */
function resumeArgv(argv) {
  if (!Array.isArray(argv) || argv.length === 0) return undefined
  if (argv[0] === '--resume-task' || argv[0].startsWith('--resume-task=')) return [...argv]
  if (argv.length === 1 && !argv[0].startsWith('-')) return ['--resume-task', argv[0]]
  throw new Error('action=status 只接受空 argv（本地自检）或 ["--resume-task","<taskId>"]（续查历史任务）。')
}

/** 注册 `xiapan_music` 工具。 */
function registerMusicTool(ctx) {
  ctx.tools.register(defineTool({
    name: 'xiapan_music',
    description:
      '用虾盘云音乐（Suno v6）出完整歌、纯音乐、歌词或查余额。'
      + ' action=song：写整歌。argv 用 ["--theme","一句话主题"]，可选 ["--style","民谣"] ["--title","歌名"]，'
      + '也可用 ["--lyrics-file","<路径>"] 或 ["--lyrics-json","<card.json>"] 传用户已有歌词。'
      + ' 两段式硬规则：先不带 --confirm 调一次，脚本只返回「制作卡」（歌名/风格标签/歌词/成本，不扣费、不提交）；'
      + '把制作卡给用户确认后，再用同一组参数加 "--confirm" 调第二次，才会真实提交（约 ¥2.4 一次，一次出 2 首，60-90 秒）。'
      + ' action=instrumental：纯音乐 BGM（argv 用 ["--prompt","风格/场景描述"]，--theme 是别名；约 ¥1/首）。'
      + ' action=lyrics：只写词（["--theme","..."]，可 ["--style","民谣"]），不生成音频、不扣费。'
      + ' action=balance：查余额（argv=[]，免费）。'
      + ' action=status：零费用自检（argv=[]）；查历史任务用 ["--resume-task","<taskId>"]（只续查下载，不重新提交）。'
      + ' 产物默认保存到 ~/Music/虾盘云音乐/（可用 ["--out-dir","<目录>"] 覆盖），返回里有绝对路径、时长、标题和 nextSteps 链接；不要返回音频二进制/base64。'
      + ' 一次调用只提交一次，失败不要自动重试（余额/Key 问题先查 balance）。'
      + ' 虾盘云 Key 由 DSH 凭据 XIAPAN_API_KEY 或本机设备 Key 提供，绝不能放进 argv 或对话。',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['song', 'instrumental', 'lyrics', 'balance', 'status'],
        description: '要执行的动作。',
      },
      argv: {
        type: 'array',
        required: true,
        items: { type: 'string' },
        description:
          '传给虾盘云音乐脚本的参数（如 ["--theme","深夜便利店的民谣"] 或 ["--theme","...","--confirm"]），'
          + '不包含 action、--json、--key、--env-file。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          json: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.json }],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    async execute({ action, argv }, exec) {
      const secret = await resolveApiKey(ctx)
      const safeArgv = sanitizeArgv(ctx, argv, action, secret)

      if (action === 'status') {
        const resume = resumeArgv(safeArgv)
        if (resume === undefined) {
          return { json: JSON.stringify(statusPayload(ctx, secret), null, 2) }
        }
        return await runScript(ctx, 'status', join(SCRIPT_DIR, 'song.mjs'), resume, secret, exec)
      }

      const script = resolveScript(action)
      return await runScript(ctx, action, script, safeArgv, secret, exec)
    },
  }))
}

/** 起一次脚本子进程，脱敏并解析 JSON；`NEEDS_CONFIRMATION` 作为正常结果返回。 */
async function runScript(ctx, action, script, safeArgv, secret, exec) {
  if (!existsSync(script)) {
    throw new Error(`没有找到脚本 ${script}。说明插件包缺少 skills/xiapan-music/scripts/，请重新安装 dsh-xiapan-music。`)
  }
  const node = await resolveNode(ctx, exec.signal)
  const child = ctx.subprocess.spawn({
    argv: [node, script, ...scriptArgv(safeArgv)],
    cwd: workingDirectory(exec),
    signal: exec.signal,
    graceMs: 3_000,
    env: {
      // DSH 会剥离环境里所有“像凭据”的变量；这条显式注入只到达本次子进程，
      // 让脚本无需读盘也能拿到 Key。未配置时留空，脚本自兜底设备 Key。
      ...(secret === undefined ? {} : { XIAPAN_API_KEY: secret }),
      // 归因：nextSteps 里的画板/充值链接要带 utm_medium=plugin（区别 Agent Skill）。
      XIAPAN_UTM_SOURCE: SOURCE,
      XIAPAN_UTM_MEDIUM: 'plugin',
      NO_COLOR: '1',
    },
    stdio: {
      stdin: 'ignore',
      stdout: { maxBytes: 1_000_000, spill: { maxBytes: 4_000_000 } },
      stderr: { maxBytes: 128_000 },
    },
  })

  const outcome = await child.done
  const stdout = collectedText(child.collected.stdout)
  const stderr = collectedText(child.collected.stderr)
  const safeStdout = redactSecrets(stdout.text, secret)
  const safeStderr = redactSecrets(stderr.text, secret)

  if (stdout.lossy) {
    throw new Error('虾盘云音乐脚本的输出超过 DSH 工具的安全上限；请缩小 argv 或改用 --out-dir 落盘。')
  }

  let payload
  try {
    payload = safeStdout.length === 0 ? undefined : JSON.parse(safeStdout)
  } catch (error) {
    if (outcome.exitCode !== 0) throw scriptFailure(action, safeStdout, safeStderr, outcome.exitCode)
    throw new Error('虾盘云音乐脚本没有返回有效 JSON', { cause: error })
  }

  const errorCode = payload?.error?.code ?? payload?.code
  // 制作卡 / 待确认不是失败：把完整 card 交给模型去给用户确认。
  if (errorCode === 'NEEDS_CONFIRMATION' || payload?.card !== undefined) {
    return { json: JSON.stringify(payload) }
  }

  if (outcome.exitCode !== 0) {
    const message = payload?.error?.message ?? payload?.message
    const detail = typeof message === 'string' && message.length > 0
      ? message
      : scriptFailure(action, safeStdout, safeStderr, outcome.exitCode).message
    throw new Error(`虾盘云音乐 ${action} 失败（${errorCode ?? 'ERROR'}）：${detail}`)
  }
  if (payload === undefined) throw new Error('虾盘云音乐脚本没有输出，重试前先检查 Key 与余额。')

  return { json: JSON.stringify(payload) }
}

/**
 * 插件入口：注册内置技能提供者 + `xiapan_music` 工具。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文
 */
export function apply(ctx) {
  ctx.skills.registerProvider(
    (control) =>
      new FileSystemSkillProvider(ctx, control, {
        providerName: 'xiapan-music',
        includeDefaultRoots: false,
        bundledSkillDir: SKILL_ROOT,
      }),
  )

  registerMusicTool(ctx)

  ctx.effect(() => () => {
    logDebug(ctx, 'dsh-xiapan-music disposed')
  }, 'dsh-xiapan-music cleanup')
}
