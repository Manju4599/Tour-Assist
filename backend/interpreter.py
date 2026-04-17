"""
interpreter.py — Real-time two-way translation via Groq API.
"""
from typing import Optional


def translate_text(
    client,
    model_name: str,
    text: str,
    from_lang: str,
    to_lang: str,
    context: Optional[str] = None,
) -> str:
    """
    Translate `text` from `from_lang` to `to_lang`.
    Returns the translated string only.
    """
    system_prompt = (
        f"You are a professional real-time interpreter for travelers. "
        f"Translate the following text from {from_lang} to {to_lang}. "
        f"Return ONLY the translated text — no explanations, no notes, no quotes. "
        f"Preserve the tone and meaning exactly."
    )
    if context:
        system_prompt += f"\nContext: {context}"

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": text,
                }
            ],
            model=model_name,
            temperature=0.3,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"Translation failed: {e}")
