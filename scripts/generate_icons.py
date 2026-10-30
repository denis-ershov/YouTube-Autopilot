"""
Генератор фирменных иконок YouTube Autopilot.

Единый источник геометрии логотипа: из констант ниже строятся
  - public/icons/icon.svg  (используется компонентом <Logo /> и как мастер-файл);
  - public/icons/icon-{16,32,48,128,512}.png (иконки манифеста и README).

Концепция: кольцо прогресса (~83%, «отслеживание реального просмотра»)
вокруг скруглённого треугольника Play на сине-индиго «squircle»;
янтарная точка в разрыве кольца — порог, на котором срабатывает автодействие.

Запуск: python scripts/generate_icons.py  (требуется Pillow)
"""

import math
import os

from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "icons")

CANVAS = 512
SQUIRCLE_INSET = 16
SQUIRCLE_RADIUS = 116
GRADIENT_FROM = "#3B82F6"  # brand-500
GRADIENT_TO = "#4338CA"  # indigo-700

RING_CENTER = 256
RING_RADIUS = 146
RING_WIDTH = 34
RING_TRACK_OPACITY = 0.22
ARC_START_DEG = -90  # 12 часов
ARC_SWEEP_DEG = 300  # ~83% окружности

# Маркер порога автодействия в разрыве кольца
MARKER_ANGLE_DEG = -120
MARKER_RADIUS = 15
MARKER_COLOR = "#FBBF24"  # amber-400

PLAY_POINTS = [(228, 190), (228, 322), (340, 256)]
PLAY_ROUNDING = 26  # толщина скругляющего штриха вершин

PNG_SIZES = [16, 32, 48, 128, 512]
SUPERSAMPLE = 2048


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def arc_point(angle_deg):
    rad = math.radians(angle_deg)
    return (
        RING_CENTER + RING_RADIUS * math.cos(rad),
        RING_CENTER + RING_RADIUS * math.sin(rad),
    )


def fmt(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def build_svg():
    sx, sy = arc_point(ARC_START_DEG)
    ex, ey = arc_point(ARC_START_DEG + ARC_SWEEP_DEG)
    mx, my = arc_point(MARKER_ANGLE_DEG)
    large_arc = 1 if ARC_SWEEP_DEG > 180 else 0
    size = CANVAS - 2 * SQUIRCLE_INSET
    points = " ".join(f"{x},{y}" for x, y in PLAY_POINTS)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}" role="img" aria-label="YouTube Autopilot">
  <!-- Сгенерировано scripts/generate_icons.py — не редактировать вручную -->
  <defs>
    <linearGradient id="ytap-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{GRADIENT_FROM}"/>
      <stop offset="1" stop-color="{GRADIENT_TO}"/>
    </linearGradient>
  </defs>
  <rect x="{SQUIRCLE_INSET}" y="{SQUIRCLE_INSET}" width="{size}" height="{size}" rx="{SQUIRCLE_RADIUS}" fill="url(#ytap-bg)"/>
  <circle cx="{RING_CENTER}" cy="{RING_CENTER}" r="{RING_RADIUS}" fill="none" stroke="#fff" stroke-opacity="{RING_TRACK_OPACITY}" stroke-width="{RING_WIDTH}"/>
  <path d="M{fmt(sx)} {fmt(sy)}A{RING_RADIUS} {RING_RADIUS} 0 {large_arc} 1 {fmt(ex)} {fmt(ey)}" fill="none" stroke="#fff" stroke-width="{RING_WIDTH}" stroke-linecap="round"/>
  <circle cx="{fmt(mx)}" cy="{fmt(my)}" r="{MARKER_RADIUS}" fill="{MARKER_COLOR}"/>
  <polygon points="{points}" fill="#fff" stroke="#fff" stroke-width="{PLAY_ROUNDING}" stroke-linejoin="round"/>
</svg>
"""


def diagonal_gradient(size):
    """Линейный градиент из левого верхнего угла в правый нижний: t = (x + y) / 2."""
    vertical = Image.linear_gradient("L").resize((size, size))
    horizontal = vertical.rotate(90)  # слева 0 → справа 255
    mask = ImageChops.add(vertical, horizontal, scale=2)
    start = Image.new("RGBA", (size, size), hex_to_rgb(GRADIENT_FROM) + (255,))
    end = Image.new("RGBA", (size, size), hex_to_rgb(GRADIENT_TO) + (255,))
    return Image.composite(end, start, mask)


def render_master():
    s = SUPERSAMPLE / CANVAS
    img = Image.new("RGBA", (SUPERSAMPLE, SUPERSAMPLE), (0, 0, 0, 0))

    # Фон: градиент, обрезанный по маске squircle
    shape = Image.new("L", img.size, 0)
    inset = SQUIRCLE_INSET * s
    ImageDraw.Draw(shape).rounded_rectangle(
        [inset, inset, SUPERSAMPLE - inset, SUPERSAMPLE - inset], radius=SQUIRCLE_RADIUS * s, fill=255
    )
    img.paste(diagonal_gradient(SUPERSAMPLE), (0, 0), shape)

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    c, r, w = RING_CENTER * s, RING_RADIUS * s, RING_WIDTH * s
    outer = [c - r - w / 2, c - r - w / 2, c + r + w / 2, c + r + w / 2]

    # Дорожка кольца (полупрозрачная)
    track = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(track).ellipse(outer, outline=(255, 255, 255, int(255 * RING_TRACK_OPACITY)), width=int(w))
    img = Image.alpha_composite(img, track)

    # Дуга прогресса со скруглёнными концами
    draw.arc(outer, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG, fill=(255, 255, 255, 255), width=int(w))
    for angle in (ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG):
        px, py = arc_point(angle)
        draw.ellipse([px * s - w / 2, py * s - w / 2, px * s + w / 2, py * s + w / 2], fill=(255, 255, 255, 255))

    # Маркер порога
    mx, my = arc_point(MARKER_ANGLE_DEG)
    mr = MARKER_RADIUS * s
    draw.ellipse([mx * s - mr, my * s - mr, mx * s + mr, my * s + mr], fill=hex_to_rgb(MARKER_COLOR) + (255,))

    # Треугольник Play со скруглёнными вершинами
    pts = [(x * s, y * s) for x, y in PLAY_POINTS]
    rr = PLAY_ROUNDING * s / 2
    draw.polygon(pts, fill=(255, 255, 255, 255))
    draw.line(pts + [pts[0]], fill=(255, 255, 255, 255), width=int(PLAY_ROUNDING * s), joint="curve")
    for x, y in pts:
        draw.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(255, 255, 255, 255))

    return Image.alpha_composite(img, overlay)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "icon.svg"), "w", encoding="utf-8", newline="\n") as f:
        f.write(build_svg())

    master = render_master()
    for size in PNG_SIZES:
        master.resize((size, size), Image.Resampling.LANCZOS).save(
            os.path.join(OUT_DIR, f"icon-{size}.png"), optimize=True
        )
    print(f"Иконки обновлены в {OUT_DIR}: icon.svg, " + ", ".join(f"icon-{n}.png" for n in PNG_SIZES))


if __name__ == "__main__":
    main()
