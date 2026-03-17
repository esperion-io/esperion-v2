#!/usr/bin/env python3
"""Add Chinese text overlay to Xiaohongshu images."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import sys

FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_LIGHT = "/System/Library/Fonts/STHeiti Light.ttc"

def add_text_with_shadow(draw, position, text, font, fill="white", shadow_color=(0,0,0,160), shadow_offset=3):
    """Add text with drop shadow for readability."""
    x, y = position
    # Shadow
    shadow_font = font
    draw.text((x + shadow_offset, y + shadow_offset), text, font=shadow_font, fill=shadow_color)
    # Main text
    draw.text((x, y), text, font=font, fill=fill)

def add_gradient_bar(img, y_start, height, color=(0, 0, 0), opacity=140):
    """Add a semi-transparent gradient bar for text background."""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(height):
        # Gradient from full opacity in center to less at edges
        progress = 1.0 - abs(i - height/2) / (height/2)
        alpha = int(opacity * (0.5 + 0.5 * progress))
        draw.line([(0, y_start + i), (img.width, y_start + i)], fill=(*color, alpha))
    return Image.alpha_composite(img.convert('RGBA'), overlay)

def fit_text(draw, text, font_path, max_width, start_size=80, min_size=30):
    """Find the largest font size that fits within max_width."""
    for size in range(start_size, min_size - 1, -2):
        font = ImageFont.truetype(font_path, size, index=0)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font, size
    return ImageFont.truetype(font_path, min_size, index=0), min_size

def process_image(input_path, output_path, title_text, subtitle_text=None, position="top"):
    """Add text overlay to an image."""
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    margin = int(w * 0.08)
    max_text_width = w - margin * 2
    
    # Create drawing context for text measurement
    temp_draw = ImageDraw.Draw(img)
    
    # Fit title
    title_font, title_size = fit_text(temp_draw, title_text, FONT_BOLD, max_text_width, start_size=72, min_size=36)
    
    # Calculate text block height
    title_bbox = temp_draw.textbbox((0, 0), title_text, font=title_font)
    title_h = title_bbox[3] - title_bbox[1]
    
    subtitle_font = None
    subtitle_h = 0
    if subtitle_text:
        subtitle_font, _ = fit_text(temp_draw, subtitle_text, FONT_LIGHT, max_text_width, start_size=42, min_size=24)
        sub_bbox = temp_draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
        subtitle_h = sub_bbox[3] - sub_bbox[1]
    
    total_text_h = title_h + (subtitle_h + 15 if subtitle_text else 0)
    bar_padding = 30
    bar_height = total_text_h + bar_padding * 2
    
    # Position
    if position == "top":
        bar_y = int(h * 0.05)
    elif position == "center":
        bar_y = (h - bar_height) // 2
    elif position == "bottom":
        bar_y = int(h * 0.75)
    else:
        bar_y = int(h * 0.05)
    
    # Add gradient bar
    img = add_gradient_bar(img, bar_y, bar_height, opacity=160)
    draw = ImageDraw.Draw(img)
    
    # Draw title (centered)
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_x = (w - title_w) // 2
    title_y = bar_y + bar_padding
    
    add_text_with_shadow(draw, (title_x, title_y), title_text, title_font, fill="white")
    
    # Draw subtitle
    if subtitle_text and subtitle_font:
        sub_bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = (w - sub_w) // 2
        sub_y = title_y + title_h + 15
        add_text_with_shadow(draw, (sub_x, sub_y), subtitle_text, subtitle_font, fill=(255, 220, 100, 255))
    
    # Save
    img = img.convert('RGB')
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")

def process_multiline(input_path, output_path, lines, position="top"):
    """Add multiple lines of text to an image."""
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    margin = int(w * 0.08)
    max_text_width = w - margin * 2
    
    temp_draw = ImageDraw.Draw(img)
    
    # Calculate all lines
    line_data = []
    total_h = 0
    for text, style in lines:
        font_path = FONT_BOLD if style == "bold" else FONT_LIGHT
        start = 64 if style == "bold" else 40
        font, size = fit_text(temp_draw, text, font_path, max_text_width, start_size=start, min_size=24)
        bbox = temp_draw.textbbox((0, 0), text, font=font)
        line_h = bbox[3] - bbox[1]
        line_data.append((text, font, line_h, style))
        total_h += line_h + 12
    
    bar_padding = 25
    bar_height = total_h + bar_padding * 2
    
    if position == "top":
        bar_y = int(h * 0.05)
    elif position == "center":
        bar_y = (h - bar_height) // 2
    else:
        bar_y = int(h * 0.72)
    
    img = add_gradient_bar(img, bar_y, bar_height, opacity=160)
    draw = ImageDraw.Draw(img)
    
    current_y = bar_y + bar_padding
    for text, font, line_h, style in line_data:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_x = (w - text_w) // 2
        color = "white" if style == "bold" else (255, 220, 100, 255)
        add_text_with_shadow(draw, (text_x, current_y), text, font, fill=color)
        current_y += line_h + 12
    
    img = img.convert('RGB')
    img.save(output_path, quality=95)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    base = os.path.expanduser("~/Projects/esperion/xiaohongshu/images/day01")
    out = os.path.join(base, "final")
    os.makedirs(out, exist_ok=True)
    
    # Image 1 — Cover
    process_multiline(
        f"{base}/01-cover.png",
        f"{out}/01-cover.png",
        [
            ("在NZ，AI帮你赚更多+省更多", "bold"),
            ("做生意 + 个人 — 一次看够", "light"),
        ],
        position="top"
    )
    
    # Image 2 — Business title
    process_image(
        f"{base}/02-business-title.png",
        f"{out}/02-business-title.png",
        "你的生意每月少赚多少？",
        position="top"
    )
    
    # Image 3 — ROI data
    process_multiline(
        f"{base}/03-roi-data.png",
        f"{out}/03-roi-data.png",
        [
            ("🔧 水电工 -$15,048/月", "bold"),
            ("🏠 中介 -$28,000/月", "bold"),
            ("📦 进出口 -$9,000/月", "bold"),
        ],
        position="center"
    )
    
    # Image 4 — Business scenes
    process_multiline(
        f"{base}/04-business-scenes.png",
        f"{out}/04-business-scenes.png",
        [
            ("24/7接客 · 自动跟进", "bold"),
            ("评价管理 · 营业报告", "bold"),
        ],
        position="bottom"
    )
    
    # Image 5 — Personal title
    process_image(
        f"{base}/05-personal-title.png",
        f"{out}/05-personal-title.png",
        "这些事搞错了/不做",
        "你亏多少？",
        position="top"
    )
    
    # Image 6 — Personal values
    process_multiline(
        f"{base}/06-personal-values.png",
        f"{out}/06-personal-values.png",
        [
            ("📄 合同解读 → 省$500+", "light"),
            ("💰 保险比较 → 省$3,000/年", "light"),
            ("📋 签证管理 → 省$500+", "light"),
            ("🧾 税务优化 → 省$1,000+", "light"),
            ("🏥 ACC claim → 省$10,000+", "light"),
        ],
        position="center"
    )
    
    # Image 7 — Pricing
    process_multiline(
        f"{base}/07-pricing.png",
        f"{out}/07-pricing.png",
        [
            ("从$99/月起", "bold"),
            ("中英双语 · 奥克兰本地", "light"),
            ("政府可补贴$15K", "light"),
        ],
        position="center"
    )
    
    # Image 8 — CTA
    process_multiline(
        f"{base}/08-cta.png",
        f"{out}/08-cta.png",
        [
            ("免费15分钟咨询", "bold"),
            ("加微信 / 私信我 💬", "light"),
        ],
        position="center"
    )
    
    print("\nAll 8 images processed!")
