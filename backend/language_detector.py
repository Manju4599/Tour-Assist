"""
language_detector.py — Detect input language using langdetect,
with Gemini fallback.
"""
from langdetect import detect, LangDetectException

LANG_NAMES = {
    "en": "English", "ta": "Tamil", "hi": "Hindi", "ja": "Japanese",
    "zh-cn": "Chinese", "zh-tw": "Chinese (Traditional)", "ar": "Arabic",
    "fr": "French", "de": "German", "es": "Spanish", "pt": "Portuguese",
    "ru": "Russian", "ko": "Korean", "it": "Italian", "nl": "Dutch",
    "pl": "Polish", "tr": "Turkish", "vi": "Vietnamese", "th": "Thai",
    "ml": "Malayalam", "te": "Telugu", "kn": "Kannada", "bn": "Bengali",
    "ur": "Urdu", "mr": "Marathi", "gu": "Gujarati", "pa": "Punjabi",
}


def detect_language(text: str) -> dict:
    """
    Returns { code: str, name: str }
    Falls back to 'en' on failure.
    """
    if not text or not text.strip():
        return {"code": "en", "name": "English"}
    try:
        code = detect(text)
        name = LANG_NAMES.get(code, code.upper())
        return {"code": code, "name": name}
    except LangDetectException:
        return {"code": "en", "name": "English"}
