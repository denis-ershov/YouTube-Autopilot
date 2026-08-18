import os
from PIL import Image, ImageDraw, ImageFilter

def create_icon(size=1024):
    # Render at 1024 for supersampling
    scale = size / 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Squircle
    padding = int(24 * scale)
    corner_radius = int(112 * scale)
    rect_box = [padding, padding, size - padding, size - padding]
    
    # Outer Glow / Background
    draw.rounded_rectangle(rect_box, radius=corner_radius, fill=(15, 23, 42, 255), outline=(56, 189, 248, 255), width=int(8 * scale))

    # 2. Antennas
    # Center Antenna
    draw.line([int(256 * scale), int(140 * scale), int(256 * scale), int(95 * scale)], fill=(56, 189, 248, 255), width=int(12 * scale))
    r_center = int(18 * scale)
    draw.ellipse([int(256 * scale) - r_center, int(85 * scale) - r_center, int(256 * scale) + r_center, int(85 * scale) + r_center], fill=(56, 189, 248, 255))

    # Left Antenna
    draw.line([int(160 * scale), int(170 * scale), int(120 * scale), int(120 * scale)], fill=(99, 102, 241, 255), width=int(10 * scale))
    r_side = int(14 * scale)
    draw.ellipse([int(110 * scale) - r_side, int(110 * scale) - r_side, int(110 * scale) + r_side, int(110 * scale) + r_side], fill=(99, 102, 241, 255))

    # Right Antenna
    draw.line([int(352 * scale), int(170 * scale), int(392 * scale), int(120 * scale)], fill=(239, 68, 68, 255), width=int(10 * scale))
    draw.ellipse([int(402 * scale) - r_side, int(110 * scale) - r_side, int(402 * scale) + r_side, int(110 * scale) + r_side], fill=(239, 68, 68, 255))

    # 3. Outer Robot Chassis
    draw.rounded_rectangle(
        [int(116 * scale), int(140 * scale), int(396 * scale), int(370 * scale)],
        radius=int(56 * scale),
        fill=(30, 41, 59, 255),
        outline=(51, 65, 85, 255),
        width=int(6 * scale)
    )

    # 4. Visor / Screen
    draw.rounded_rectangle(
        [int(136 * scale), int(160 * scale), int(376 * scale), int(350 * scale)],
        radius=int(40 * scale),
        fill=(11, 15, 25, 255),
        outline=(30, 41, 59, 255),
        width=int(4 * scale)
    )

    # 5. Glowing Eyes
    # Left Eye
    lx, ly, er = int(195 * scale), int(220 * scale), int(26 * scale)
    draw.ellipse([lx - er, ly - er, lx + er, ly + er], fill=(2, 132, 199, 255))
    er_in = int(16 * scale)
    draw.ellipse([lx - er_in, ly - er_in, lx + er_in, ly + er_in], fill=(56, 189, 248, 255))
    er_pupil = int(7 * scale)
    draw.ellipse([lx - er_pupil, ly - er_pupil, lx + er_pupil, ly + er_pupil], fill=(255, 255, 255, 255))

    # Right Eye
    rx, ry = int(317 * scale), int(220 * scale)
    draw.ellipse([rx - er, ry - er, rx + er, ry + er], fill=(2, 132, 199, 255))
    draw.ellipse([rx - er_in, ry - er_in, rx + er_in, ry + er_in], fill=(56, 189, 248, 255))
    draw.ellipse([rx - er_pupil, ry - er_pupil, rx + er_pupil, ry + er_pupil], fill=(255, 255, 255, 255))

    # 6. YouTube Play Triangle (Autopilot mouth/badge)
    triangle = [
        (int(232 * scale), int(270 * scale)),
        (int(295 * scale), int(305 * scale)),
        (int(232 * scale), int(340 * scale)),
    ]
    draw.polygon(triangle, fill=(239, 68, 68, 255))

    # 7. Side Audio Nodes
    draw.rounded_rectangle([int(96 * scale), int(215 * scale), int(116 * scale), int(295 * scale)], radius=int(8 * scale), fill=(56, 189, 248, 255))
    draw.rounded_rectangle([int(396 * scale), int(215 * scale), int(416 * scale), int(295 * scale)], radius=int(8 * scale), fill=(239, 68, 68, 255))

    # 8. Bottom Indicator Lights
    r_node = int(6 * scale)
    draw.ellipse([int(210 * scale) - r_node, int(400 * scale) - r_node, int(210 * scale) + r_node, int(400 * scale) + r_node], fill=(56, 189, 248, 255))
    draw.ellipse([int(256 * scale) - r_node, int(400 * scale) - r_node, int(256 * scale) + r_node, int(400 * scale) + r_node], fill=(99, 102, 241, 255))
    draw.ellipse([int(302 * scale) - r_node, int(400 * scale) - r_node, int(302 * scale) + r_node, int(400 * scale) + r_node], fill=(239, 68, 68, 255))

    return img

def main():
    os.makedirs("public/icons", exist_ok=True)
    master = create_icon(1024)

    sizes = [16, 32, 48, 128, 512]
    for s in sizes:
        resized = master.resize((s, s), Image.Resampling.LANCZOS)
        out_path = f"public/icons/icon-{s}.png"
        resized.save(out_path, "PNG", optimize=True)
        print(f"Generated {out_path} ({s}x{s})")

    # Also save logo.png for UI
    master.resize((256, 256), Image.Resampling.LANCZOS).save("public/icons/logo.png", "PNG", optimize=True)

if __name__ == "__main__":
    main()
