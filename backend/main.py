"""
main.py — FastAPI backend for TourMind AI Tourist Assistant.
Uses the Groq API.
"""
import os
import uuid
from typing import Optional

from groq import Groq
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from history_store import append_message, delete_session, get_messages, list_sessions
from interpreter import translate_text
from language_detector import detect_language
from vision_handler import prepare_image_base64

# ── Env & Groq setup ──────────────────────────────────────────────────────────
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY", "")
if not API_KEY or API_KEY == "gsk_your_groq_api_key_here":
    print("⚠️  WARNING: GROQ_API_KEY not set in .env — AI features will fail.")

client = Groq(api_key=API_KEY)
# We use a text model for normal text, and a vision model for multimodal input.
MODEL_NAME_TEXT = "llama-3.3-70b-versatile"
MODEL_NAME_VISION = "llama-3.2-11b-vision-preview"

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="TourMind AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))


@app.get("/")
async def serve_frontend():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    return {"message": "TourMind AI backend running. Open frontend/index.html."}


@app.get("/styles.css")
async def serve_css():
    return FileResponse(os.path.join(FRONTEND_DIR, "styles.css"), media_type="text/css")


@app.get("/main.js")
async def serve_js():
    return FileResponse(os.path.join(FRONTEND_DIR, "main.js"), media_type="application/javascript")


# ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are TourMind AI, an expert multilingual tourist assistant helping global travelers.

Your capabilities:
- Answer questions about tourist destinations, landmarks, culture, food, transport, safety, currency, local customs
- Analyze images of places, landmarks, food menus, signs, maps, and anything travelers encounter
- Provide practical travel tips and recommendations
- Describe what you see in images with context useful for a traveler

Language rules (CRITICAL):
- ALWAYS detect the language of the user's message
- ALWAYS respond in the EXACT SAME language the user used
- If the user writes in Tamil, respond fully in Tamil
- If Hindi, respond in Hindi. If Japanese, respond in Japanese. And so on.
- NEVER switch languages unless explicitly asked
- Handle mixed-language queries gracefully

Tone: Friendly, knowledgeable, concise but thorough. Use emojis sparingly for warmth."""


# ── /api/chat ─────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(
    message: str = Form(""),
    session_id: str = Form(default=""),
    image: Optional[UploadFile] = File(default=None),
):
    if not session_id:
        session_id = str(uuid.uuid4())

    if not message.strip() and not image:
        raise HTTPException(status_code=400, detail="Provide a message or an image.")

    has_image = image is not None

    # Detect language
    lang_info = detect_language(message) if message.strip() else {"code": "en", "name": "English"}

    # Save user message
    append_message(session_id, "user", message, has_image=has_image)

    # Build conversation history for context (last 20 messages)
    history = get_messages(session_id)
    history_text = ""
    for m in history[-20:]:
        role_label = "user" if m["role"] == "user" else "assistant"
        history_text += f"{role_label.capitalize()}: {m['content']}\n"

    # We can provide the system prompt + history as a system message.
    # We will build messages for Groq format.
    
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nConversation so far:\n{history_text}\nDetected user language: {lang_info['name']} ({lang_info['code']})"},
    ]

    # Select model based on presence of image
    current_model = MODEL_NAME_VISION if has_image else MODEL_NAME_TEXT

    content_message = []
    
    if has_image:
        try:
            image_bytes = await image.read()
            base64_image = prepare_image_base64(image_bytes, image.content_type or "image/jpeg")
            user_text = message.strip() or "Please describe this image in detail and provide relevant tourist information."
            
            content_message.append({"type": "text", "text": user_text})
            content_message.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}"
                }
            })
            
            messages.append({"role": "user", "content": content_message})
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
    else:
        messages.append({"role": "user", "content": message})

    # Call Groq
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=current_model,
            temperature=0.7,
            max_tokens=2048,
        )
        reply = chat_completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    # Save assistant reply
    append_message(session_id, "assistant", reply)

    return {
        "reply": reply,
        "session_id": session_id,
        "detected_lang": lang_info,
    }


# ── /api/interpret ────────────────────────────────────────────────────────────
class InterpretRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str


@app.post("/api/interpret")
async def interpret(req: InterpretRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if req.from_lang == req.to_lang:
        return {"translation": req.text, "note": "Source and target are the same."}
    try:
        translation = translate_text(client, MODEL_NAME_TEXT, req.text, req.from_lang, req.to_lang)
        return {"translation": translation}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── /api/history ──────────────────────────────────────────────────────────────
@app.get("/api/history")
async def get_all_sessions():
    return {"sessions": list_sessions()}


@app.get("/api/history/{session_id}")
async def get_session_history(session_id: str):
    messages = get_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@app.delete("/api/history/{session_id}")
async def delete_session_route(session_id: str):
    delete_session(session_id)
    return {"success": True, "session_id": session_id}


# ── /api/health ───────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_NAME_TEXT,
        "api_key_set": bool(API_KEY and API_KEY != "gsk_your_groq_api_key_here"),
    }
