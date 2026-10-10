
def text_width_in_pixels(text: str, font_path: str = "arial.ttf", font_size: int = 10) -> int:
    from PIL import Image, ImageDraw, ImageFont

    # Create a dummy image
    img = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(img)

    # Load Arial font at size 10
    font = ImageFont.truetype(font_path, font_size)

    # Measure text width
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]  # right - left
    return width