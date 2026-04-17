"""
vision_handler.py — Image processing for Groq multimodal input.
"""
import io
import base64
from PIL import Image


def prepare_image_base64(file_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """
    Convert raw image bytes into a base64 string.
    Resizes large images to max 1024px to stay within limits.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        # Convert to RGB (handles PNG transparency etc.)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        # Resize if too large
        max_dim = 1024
        if max(img.width, img.height) > max_dim:
            ratio = max_dim / max(img.width, img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        # Re-encode as JPEG bytes
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        jpeg_bytes = buf.getvalue()
        # Return base64 string
        return base64.b64encode(jpeg_bytes).decode('utf-8')
    except Exception as e:
        raise ValueError(f"Image processing failed: {e}")
