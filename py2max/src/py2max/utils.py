
def hex2rgb(hex_color: str) -> list:
    hex_color = hex_color.lstrip('#')
    return [int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4)]

def hex2rgba(hex_color: str) -> list:
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        hex_color += 'FF'
    return [int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4, 6)]


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