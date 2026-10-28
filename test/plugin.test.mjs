// dsh-xiapan-music 单元测试（node --test）
//
// 覆盖插件自有逻辑：注册、argv 组装、Key 脱敏、制作卡透传、错误映射、UTM/凭据注入。
// 子进程与凭据服务用替身，不联网、不花钱、不需要 DSH 宿主进程。
// 前置：`@deepseek-ai/dsh-tools` 等宿主包可解析（本机 dev 用 node_modules 内的转发 shim）；
// 解析不到时整组跳过（外部 CI 不装 DSH 也能绿）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIXTURE_KEY = 'sk-test-FIXTURE-KEY-0123456789'

let plugin
let hostPackagesAvailable = true
let pluginError
try {
  plugin = await import(pathToFileURL(join(ROOT, 'index.mjs')).href)
} catch (error) {
  hostPackagesAvailable = false
  pluginError = error
}

const skip = !hostPackagesAvailable
if (skip) {
  console.error(`跳过：宿主包不可解析（${pluginError?.code ?? 'unknown'}），这不是插件失败。`)
}

/** 造一个最小 ctx：记录注册结果，subprocess.spawn 返回可编排的假进程。 */
function makeContext({ credentials, spawnScript } = {}) {
  const state = { tool: undefined, provider: undefined, spawns: [] }
  const ctx = {
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    get(name) {
      if (name !== 'credentials') return undefined
      if (credentials === undefined) return undefined
      return {
        describe: async () => ({ configured: true }),
        resolve: async () => ({ value: credentials.value, source: 'test' }),
      }
    },
    skills: {
      registerProvider(factory) {
        state.provider = factory({ signal: new AbortController().signal, invalidate() {} })
        return () => {}
      },
    },
    tools: {
      register(definition) {
        state.tool = definition
        return () => {}
      },
    },
    subprocess: {
      async resolveExecutable(command) {
        return command
      },
      spawn(spec) {
        state.spawns.push(spec)
        const result = spawnScript(spec)
        return {
          done: Promise.resolve({ exitCode: result.exitCode ?? 0, signal: null }),
          collected: {
            stdout: { readFrom: () => ({ text: result.stdout ?? '', lossy: false }) },
            stderr: { readFrom: () => ({ text: result.stderr ?? '', lossy: false }) },
          },
          terminate() {},
        }
      },
    },
    effect() {
      return () => {}
    },
  }
  return { ctx, state }
}

function applyPlugin(made) {
  plugin.apply(made.ctx)
  assert.ok(made.state.tool, '插件应注册 xiapan_music 工具')
  assert.equal(made.state.tool.name, 'xiapan_music')
  assert.equal(made.state.provider?.name, 'xiapan-music')
  return made
}

function execFor(action, argv) {
  return {
    callId: 'test',
    name: 'xiapan_music',
    arguments: { action, argv },
    signal: new AbortController().signal,
    agent: { cwd: ROOT },
  }
}

async function runTool(made, action, argv) {
  const result = await made.state.tool.execute({ action, argv }, execFor(action, argv))
  return JSON.parse(result.json)
}

test('注册：工具名/动作枚举/技能提供者', { skip }, () => {
  const made = applyPlugin(makeContext({}))
  const { parameters } = made.state.tool
  assert.deepEqual(parameters.properties.action.enum, ['song', 'instrumental', 'lyrics', 'balance', 'status'])
  assert.equal(parameters.properties.argv.type, 'array')
  assert.deepEqual(parameters.required, ['action', 'argv'])
  assert.equal(made.state.tool.timeoutMs, 660_000)
  assert.match(made.state.tool.description, /¥2\.4/)
  assert.match(made.state.tool.description, /--confirm/)
})

test('status：零费用本地自检，不启动子进程', { skip }, async () => {
  const made = applyPlugin(makeContext({ credentials: { value: FIXTURE_KEY } }))
  const payload = await runTool(made, 'status', [])
  assert.equal(payload.ok, true)
  assert.equal(made.state.spawns.length, 0)
  assert.equal(payload.credentials.credentialsServiceAvailable, true)
  assert.equal(payload.credentials.xiapanApiKeyConfigured, true)
  assert.equal(payload.plugin.scripts.song.ready, true)
  assert.ok(!JSON.stringify(payload).includes(FIXTURE_KEY), '输出不得包含完整 Key')
})

test('balance：argv 自动补 --source dsh --json，注入 Key 与 UTM env', { skip }, async () => {
  const made = applyPlugin(makeContext({
    credentials: { value: FIXTURE_KEY },
    spawnScript: () => ({ stdout: JSON.stringify({ ok: true, remainCny: 1.23 }) }),
  }))
  const payload = await runTool(made, 'balance', [])
  assert.equal(payload.remainCny, 1.23)
  const spec = made.state.spawns[0]
  const argv = spec.argv.slice(2)
  assert.deepEqual(argv, ['--source', 'dsh', '--json'])
  assert.equal(spec.env.XIAPAN_API_KEY, FIXTURE_KEY)
  assert.equal(spec.env.XIAPAN_UTM_SOURCE, 'dsh')
  assert.equal(spec.env.XIAPAN_UTM_MEDIUM, 'plugin')
  assert.equal(spec.cwd, ROOT)
})

test('instrumental：走 bgm.mjs', { skip }, async () => {
  const made = applyPlugin(makeContext({
    spawnScript: () => ({ stdout: JSON.stringify({ ok: true, file: '/tmp/a.mp3' }) }),
  }))
  await runTool(made, 'instrumental', ['--prompt', '轻快钢琴'])
  assert.match(made.state.spawns[0].argv[1], /bgm\.mjs$/)
})

test('song 制作卡：NEEDS_CONFIRMATION 作为正常结果透传（不抛错）', { skip }, async () => {
  const card = { title: '测试歌', tags: 'mandarin folk', costHint: '约 ¥2.4' }
  const made = applyPlugin(makeContext({
    spawnScript: () => ({
      exitCode: 2,
      stdout: JSON.stringify({
        ok: false,
        error: { code: 'NEEDS_CONFIRMATION', message: '给用户确认' },
        card,
        nextAction: '用户确认后加 --confirm',
      }),
    }),
  }))
  const payload = await runTool(made, 'song', ['--theme', '深夜便利店'])
  assert.equal(payload.error.code, 'NEEDS_CONFIRMATION')
  assert.equal(payload.card.title, '测试歌')
  assert.deepEqual(made.state.spawns[0].argv.slice(2, 4), ['--theme', '深夜便利店'])
  assert.match(made.state.spawns[0].argv[1], /song\.mjs$/)
})

test('远端失败：错误码映射到抛错信息', { skip }, async () => {
  const made = applyPlugin(makeContext({
    spawnScript: () => ({
      exitCode: 1,
      stdout: JSON.stringify({ ok: false, error: { code: 'NETWORK', message: '网络断了' } }),
    }),
  }))
  await assert.rejects(runTool(made, 'balance', []), /NETWORK.*网络断了/s)
})

test('argv 越权：拒绝 --key/--json 与完整 Key', { skip }, async () => {
  const made = applyPlugin(makeContext({ credentials: { value: FIXTURE_KEY } }))
  await assert.rejects(runTool(made, 'balance', ['--key', 'sk-x']), /不能包含 --key/)
  await assert.rejects(runTool(made, 'balance', ['--json']), /不能包含 --json/)
  await assert.rejects(runTool(made, 'song', ['--theme', `x ${FIXTURE_KEY}`]), /不能包含虾盘云 Key/)
})

test('脱敏：已知 Key 全量替换、sk- 只留前 8 位', { skip }, () => {
  const text = `key=${FIXTURE_KEY}; other=sk-abcdef1234567890`
  const safe = plugin.redactSecrets(text, FIXTURE_KEY)
  assert.ok(!safe.includes(FIXTURE_KEY))
  assert.ok(safe.includes('sk-abcde***'))
  assert.ok(safe.includes('[REDACTED]'))
})

test('status 续查：argv 转成 song.mjs --resume-task', { skip }, async () => {
  const made = applyPlugin(makeContext({
    spawnScript: () => ({ stdout: JSON.stringify({ ok: true, taskId: 'task_123' }) }),
  }))
  const payload = await runTool(made, 'status', ['task_123'])
  assert.equal(payload.taskId, 'task_123')
  const argv = made.state.spawns[0].argv.slice(2)
  assert.equal(argv[0], '--resume-task')
  assert.equal(argv[1], 'task_123')
  assert.match(made.state.spawns[0].argv[1], /song\.mjs$/)
})
