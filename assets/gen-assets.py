# -*- coding: utf-8 -*-
"""生成虾盘云音乐的市场素材（浅色卡片风、单蓝强调、无渐变发光）。
输出：cover-og.png 1200x630 / icon-512.png 512x512 / demo-panel.png 1200x760
用法：python assets/gen-assets.py
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent
FONT_DIR = Path(r"C:\Windows\Fonts")
WHITE = (255, 255, 255)
INK = (23, 32, 42)
SUB = (91, 107, 124)
LINE = (230, 234, 240)
BLUE = (31, 111, 235)
BLUE_SOFT = (232, 240, 254)
CARD = (247, 249, 252)


def font(size, bold=False):
    name = "msyhbd.ttc" if bold else "msyh.ttc"
    path = FONT_DIR / name
    try:
        return ImageFont.truetype(str(path), size)
    except Exception:
        return ImageFont.load_default()


def rounded(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw, x, y, text, f, fg=SUB, border=LINE, fill=WHITE, padx=16, pady=9):
    tw = draw.textlength(text, font=f)
    rounded(draw, (x, y, x + tw + padx * 2, y + f.size + pady * 2), (f.size + pady * 2) // 2,
            fill=fill, outline=border, width=1)
    draw.text((x + padx, y + pady - 2), text, font=f, fill=fg)
    return x + tw + padx * 2


def waveform(draw, x, y, color=BLUE, heights=(10, 26, 16, 34, 20, 30, 12, 22), gap=7, width=5):
    cx = x
    for h in heights:
        draw.rounded_rectangle((cx, y - h // 2, cx + width, y + h // 2), radius=width // 2, fill=color)
        cx += width + gap
    return cx


def cover():
    im = Image.new("RGB", (1200, 630), WHITE)
    d = ImageDraw.Draw(im)
    # 顶部品牌行
    d.rectangle((0, 0, 1200, 6), fill=BLUE)
    d.text((72, 64), "虾盘云 · XIA PAN YUN", font=font(20), fill=SUB)
    d.text((72, 118), "虾盘云音乐", font=font(84, True), fill=INK)
    d.text((72, 232), "一句话，出一首歌。", font=font(44, True), fill=INK)
    d.text((72, 300), "AI 写词 · Suno V6 演唱 · 一次 2 首完整歌", font=font(26), fill=SUB)
    x = 72
    for t in ("Agent Skill", "DSH 插件", "BYOK 自带 Key"):
        x = pill(d, x, 366, t, font(22)) + 12

    # 右侧播放器卡片
    rounded(d, (700, 130, 1128, 440), 24, fill=CARD, outline=LINE, width=2)
    d.text((732, 162), "正在播放", font=font(20), fill=SUB)
    rounded(d, (732, 196, 832, 296), 14, fill=BLUE_SOFT)
    # 唱片
    d.ellipse((752, 216, 812, 276), fill=INK)
    d.ellipse((772, 236, 792, 256), fill=WHITE)
    d.text((852, 200), "凌晨两点的便利店", font=font(28, True), fill=INK)
    d.text((852, 242), "城市流行 · AI 演唱 · 2:11", font=font(19), fill=SUB)
    waveform(d, 732, 348)
    d.text((732, 386), "一次提交 · 2 个版本 · 可下载 mp3", font=font(18), fill=SUB)

    # 底部
    d.line((72, 520, 1128, 520), fill=LINE, width=2)
    d.text((72, 548), "虾盘云 API · api.u-claw.org", font=font(22), fill=SUB)
    d.text((742, 548), "作品可带去虾盘云画板做 MV", font=font(22), fill=BLUE)
    im.save(OUT / "cover-og.png")


def icon():
    im = Image.new("RGB", (512, 512), WHITE)
    d = ImageDraw.Draw(im)
    rounded(d, (16, 16, 496, 496), 112, fill=BLUE)
    # 白色音符
    d.ellipse((150, 316, 262, 404), fill=WHITE)
    d.rounded_rectangle((232, 150, 252, 368), radius=10, fill=WHITE)
    d.polygon([(252, 150), (392, 178), (392, 240), (252, 212)], fill=WHITE)
    d.ellipse((372, 262, 452, 318), fill=WHITE)
    im.save(OUT / "icon-512.png")


def demo():
    im = Image.new("RGB", (1200, 760), WHITE)
    d = ImageDraw.Draw(im)
    rounded(d, (24, 24, 1176, 736), 20, fill=WHITE, outline=LINE, width=2)
    d.rectangle((24, 24, 1176, 30), fill=BLUE)
    d.text((64, 58), "虾盘云音乐", font=font(30, True), fill=INK)
    d.text((64, 104), "一句话写歌 · 插件面板", font=font(20), fill=SUB)
    rounded(d, (1000, 58, 1140, 102), 22, fill=BLUE_SOFT)
    d.text((1022, 68), "已连接", font=font(18), fill=BLUE)
    d.text((64, 148), "Key", font=font(18), fill=SUB)
    rounded(d, (64, 176, 560, 224), 10, fill=CARD, outline=LINE)
    d.text((84, 188), "sk-xp-••••••••（已保存在本机）", font=font(20), fill=SUB)
    d.text((600, 148), "风格标签", font=font(18), fill=SUB)
    rounded(d, (600, 176, 960, 224), 10, fill=CARD, outline=LINE)
    d.text((620, 188), "city pop, warm, 96 BPM", font=font(20), fill=SUB)

    d.text((64, 256), "想写什么歌？", font=font(18), fill=SUB)
    rounded(d, (64, 284, 1136, 376), 12, fill=CARD, outline=LINE)
    d.text((84, 300), "写一首关于凌晨两点便利店的城市流行，温柔男声，木吉他，副歌好记", font=font(22), fill=INK)

    rounded(d, (64, 400, 300, 452), 26, fill=BLUE)
    d.text((118, 411), "生成（约 ¥2.4）", font=font(20), fill=WHITE)
    d.text((322, 411), "AI 先写词，再提交 Suno，约 60-90 秒", font=font(18), fill=SUB)

    # 结果两条
    for i, (title, dur) in enumerate([("凌晨两点的便利店 · V1", "2:11"), ("凌晨两点的便利店 · V2", "2:11")]):
        y = 486 + i * 84
        rounded(d, (64, y, 1136, y + 68), 12, fill=CARD, outline=LINE)
        d.ellipse((88, y + 14, 128, y + 54), fill=BLUE)
        d.polygon([(102, y + 24), (102, y + 44), (118, y + 34)], fill=WHITE)
        d.text((148, y + 12), title, font=font(21, True), fill=INK)
        d.text((148, y + 40), f"mp3 · {dur} · 已保存到 ~/Music/虾盘云音乐/", font=font(16), fill=SUB)
        d.text((1020, y + 22), "下载", font=font(19), fill=BLUE)

    # CTA
    rounded(d, (64, 664, 500, 712), 24, fill=WHITE, outline=BLUE, width=2)
    d.text((92, 674), "去虾盘云画板做 MV", font=font(21), fill=BLUE)
    rounded(d, (520, 664, 940, 712), 24, fill=WHITE, outline=LINE, width=2)
    d.text((548, 674), "充值 / 领一把新 Key", font=font(21), fill=SUB)
    im.save(OUT / "demo-panel.png")


if __name__ == "__main__":
    cover()
    icon()
    demo()
    for p in ("cover-og.png", "icon-512.png", "demo-panel.png"):
        img = Image.open(OUT / p)
        print(p, img.size)

