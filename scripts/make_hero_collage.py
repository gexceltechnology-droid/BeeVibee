import os
from PIL import Image, ImageDraw, ImageFilter

def make_card(img_path, width, height, radius=32, border_width=6, crop_focus='center'):
    im = Image.open(img_path).convert('RGBA')
    im_w, im_h = im.size
    target_ratio = width / height
    current_ratio = im_w / im_h

    if current_ratio > target_ratio:
        new_w = int(im_h * target_ratio)
        if crop_focus == 'right':
            offset = im_w - new_w
        elif crop_focus == 'left':
            offset = 0
        else:
            offset = (im_w - new_w) // 2
        im = im.crop((offset, 0, offset + new_w, im_h))
    else:
        new_h = int(im_w / target_ratio)
        offset = (im_h - new_h) // 2
        im = im.crop((0, offset, im_w, offset + new_h))

    im = im.resize((width, height), Image.Resampling.LANCZOS)

    # Rounded rectangle mask
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (width, height)], radius=radius, fill=255)

    rounded_im = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    rounded_im.paste(im, (0, 0), mask=mask)

    # Add white border
    b_draw = ImageDraw.Draw(rounded_im)
    b_draw.rounded_rectangle(
        [(border_width // 2, border_width // 2), (width - border_width // 2, height - border_width // 2)],
        radius=radius,
        outline=(255, 255, 255, 255),
        width=border_width
    )
    return rounded_im

def add_shadow_and_paste(canvas, card_img, pos, blur=30, offset_y=16, shadow_opacity=0.18):
    w, h = card_img.size
    pad = blur * 2
    # Shadow canvas
    shadow_w = w + pad * 2
    shadow_h = h + pad * 2
    shadow = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    
    # Shadow color in espresso
    alpha = int(255 * shadow_opacity)
    s_draw.rounded_rectangle(
        [(pad, pad), (pad + w, pad + h)],
        radius=32,
        fill=(48, 33, 31, alpha)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))

    # Paste shadow
    canvas.paste(shadow, (pos[0] - pad, pos[1] - pad + offset_y), shadow)
    # Paste card
    canvas.paste(card_img, pos, card_img)

def generate_collage():
    canvas_w = 1120
    canvas_h = 780
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))

    # 1. Top-Right: Royal Butterfly VIP with "BeeVibe" screen
    card1 = make_card('public/gallery/beevibe-royal-butterfly-vip.jpg', 560, 390, radius=32, border_width=6, crop_focus='center')
    # 2. Middle: Red Velvet Romance Heart
    card2 = make_card('public/gallery/beevibe-red-velvet-heart.jpg', 530, 370, radius=32, border_width=6, crop_focus='center')
    # 3. Bottom-Left: Pink Angel Wings Birthday Suite
    card3 = make_card('public/gallery/beevibe-pink-angel-wings.jpg', 540, 370, radius=32, border_width=6, crop_focus='center')

    # Paste in order (back to front):
    # Card 1 (Back/Top-Right)
    add_shadow_and_paste(canvas, card1, (530, 20), blur=32, offset_y=16, shadow_opacity=0.18)
    
    # Card 3 (Bottom-Left)
    add_shadow_and_paste(canvas, card3, (20, 380), blur=32, offset_y=16, shadow_opacity=0.18)

    # Card 2 (Middle - Front / Center)
    add_shadow_and_paste(canvas, card2, (260, 190), blur=38, offset_y=20, shadow_opacity=0.24)

    # Crop excess transparent borders
    bbox = canvas.getbbox()
    if bbox:
        # Add a comfortable 10px margin around bbox
        crop_box = (
            max(0, bbox[0] - 10),
            max(0, bbox[1] - 10),
            min(canvas_w, bbox[2] + 10),
            min(canvas_h, bbox[3] + 10)
        )
        final_im = canvas.crop(crop_box)
    else:
        final_im = canvas

    out_path = 'public/gallery/beevibe-hero-collage-authentic.png'
    final_im.save(out_path, 'PNG', optimize=True)
    print(f'Saved authentic hero collage to {out_path}, size: {final_im.size}')

    # Also overwrite the transparent collage so any cached references get the authentic one
    final_im.save('public/gallery/beevibe-hero-collage-transparent.png', 'PNG', optimize=True)
    print('Overwrote public/gallery/beevibe-hero-collage-transparent.png with authentic collage')

if __name__ == '__main__':
    generate_collage()
