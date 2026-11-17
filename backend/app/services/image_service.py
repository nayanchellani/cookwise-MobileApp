import io

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 8 * 1024 * 1024
# shortcut: 40 MP cap keeps decode memory sane on a small host. The app should downscale before upload.
MAX_PIXELS = 40_000_000
MAX_SIDE = 1280  # plenty for ingredient recognition, and keeps the Gemini payload small
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

Image.MAX_IMAGE_PIXELS = MAX_PIXELS  # Pillow's own decompression-bomb guard


def prepare_image(data: bytes) -> bytes:
    """Validate real image content, then return a re-encoded, downscaled JPEG.

    The filename and Content-Type are never consulted. Re-encoding strips EXIF (e.g. GPS).
    Everything stays in memory; nothing is written to disk.
    """
    if not data:
        raise HTTPException(400, "Empty image")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"Image larger than {MAX_BYTES // (1024 * 1024)} MB")
    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format not in ALLOWED_FORMATS:
                raise HTTPException(415, "Upload a JPEG, PNG or WebP image")
            if img.width * img.height > MAX_PIXELS:
                raise HTTPException(413, "Image dimensions too large")
            img.draft("RGB", (MAX_SIDE * 2, MAX_SIDE * 2))  # JPEG only: decode at reduced size
            img.load()  # full decode, so truncated or corrupt files fail here
            img = ImageOps.exif_transpose(img)
            if img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info:
                rgba = img.convert("RGBA")
                img = Image.alpha_composite(Image.new("RGBA", rgba.size, "white"), rgba)
            img = img.convert("RGB")
            img.thumbnail((MAX_SIDE, MAX_SIDE))
            out = io.BytesIO()
            img.save(out, "JPEG", quality=85)
            return out.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombError):
        # SyntaxError: Pillow raises it for some broken PNGs
        raise HTTPException(400, "Image is corrupt or unreadable") from None
