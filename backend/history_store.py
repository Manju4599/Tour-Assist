"""
history_store.py — In-memory + JSON-backed chat session store.
"""
import json
import os
from datetime import datetime
from typing import List, Dict, Any

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "history.json")

# In-memory store: { session_id: { title, created_at, messages: [...] } }
_store: Dict[str, Any] = {}


def _load_from_disk():
    global _store
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                _store = json.load(f)
        except Exception:
            _store = {}


def _save_to_disk():
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(_store, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


_load_from_disk()


def get_session(session_id: str) -> Dict[str, Any]:
    if session_id not in _store:
        _store[session_id] = {
            "title": "New Chat",
            "created_at": datetime.utcnow().isoformat(),
            "messages": [],
        }
    return _store[session_id]


def append_message(session_id: str, role: str, content: str, has_image: bool = False):
    session = get_session(session_id)
    session["messages"].append(
        {
            "role": role,
            "content": content,
            "has_image": has_image,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    # Auto-title from first user message
    if role == "user" and session["title"] == "New Chat" and content:
        session["title"] = content[:40] + ("…" if len(content) > 40 else "")
    _save_to_disk()


def get_messages(session_id: str) -> List[Dict]:
    return get_session(session_id).get("messages", [])


def list_sessions() -> List[Dict]:
    return [
        {
            "session_id": sid,
            "title": data.get("title", "Chat"),
            "created_at": data.get("created_at", ""),
            "message_count": len(data.get("messages", [])),
        }
        for sid, data in sorted(
            _store.items(), key=lambda x: x[1].get("created_at", ""), reverse=True
        )
    ]


def delete_session(session_id: str):
    if session_id in _store:
        del _store[session_id]
        _save_to_disk()
