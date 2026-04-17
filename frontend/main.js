/**
 * TourMind AI — main.js
 * Full client logic: animated background, chat engine, voice STT/TTS,
 * image handling, interpreter mode, session management.
 */

"use strict";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

const LANGUAGES = [
  { code: "English", name: "English" },
  { code: "Tamil", name: "தமிழ் (Tamil)" },
  { code: "Hindi", name: "हिन्दी (Hindi)" },
  { code: "Japanese", name: "日本語 (Japanese)" },
  { code: "Chinese", name: "中文 (Chinese)" },
  { code: "Arabic", name: "العربية (Arabic)" },
  { code: "French", name: "Français (French)" },
  { code: "German", name: "Deutsch (German)" },
  { code: "Spanish", name: "Español (Spanish)" },
  { code: "Portuguese", name: "Português (Portuguese)" },
  { code: "Russian", name: "Русский (Russian)" },
  { code: "Korean", name: "한국어 (Korean)" },
  { code: "Italian", name: "Italiano (Italian)" },
  { code: "Dutch", name: "Nederlands (Dutch)" },
  { code: "Turkish", name: "Türkçe (Turkish)" },
  { code: "Vietnamese", name: "Tiếng Việt (Vietnamese)" },
  { code: "Thai", name: "ภาษาไทย (Thai)" },
  { code: "Malayalam", name: "മലയാളം (Malayalam)" },
  { code: "Telugu", name: "తెలుగు (Telugu)" },
  { code: "Kannada", name: "ಕನ್ನಡ (Kannada)" },
  { code: "Bengali", name: "বাংলা (Bengali)" },
  { code: "Urdu", name: "اردو (Urdu)" },
  { code: "Marathi", name: "मराठी (Marathi)" },
  { code: "Gujarati", name: "ગુજરાતી (Gujarati)" },
  { code: "Punjabi", name: "ਪੰਜਾਬੀ (Punjabi)" },
];

// Falling character sets for animated background
const FALL_CHARS = [
  // Tamil
  "அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "க", "ச", "ட", "த", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன",
  // Hindi
  "अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ", "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह",
  // Japanese
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヲ", "ン",
  // Arabic
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
  // English
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  // Symbols
  "✈", "⛩", "🗺", "⭐", "🌙", "✦", "◆", "❋", "✿", "☽",
];

// ─── App State ────────────────────────────────────────────────────────────────
let sessionId = localStorage.getItem("tourmind_session") || "";
let voiceEnabled = false;
let isRecording = false;
let recognition = null;
let mediaStream = null;
let selectedImageFile = null;    // File object
let selectedImageDataURL = null; // For preview
let lastDetectedLang = { code: "en", name: "English" };
let isSidebarCollapsed = false;
let isInterpreterOpen = false;
let isSending = false;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
const chatWindow = document.getElementById("chat-window");
const welcomeScreen = document.getElementById("welcome-screen");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const cameraBtn = document.getElementById("camera-btn");
const fileInput = document.getElementById("file-input");
const sidebar = document.getElementById("sidebar");
const sessionList = document.getElementById("session-list");
const newChatBtn = document.getElementById("new-chat-btn");
const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
const voiceToggleBtn = document.getElementById("voice-toggle-btn");
const voiceIcon = document.getElementById("voice-icon");
const voiceLabel = document.getElementById("voice-label");
const interpreterPanel = document.getElementById("interpreter-panel");
const interpreterToggleBtn = document.getElementById("interpreter-toggle-btn");
const closeInterpBtn = document.getElementById("close-interp-btn");
const fromLangSelect = document.getElementById("from-lang");
const toLangSelect = document.getElementById("to-lang");
const interpInput = document.getElementById("interp-input");
const interpOutput = document.getElementById("interp-output");
const translateBtn = document.getElementById("translate-btn");
const clearInterpBtn = document.getElementById("clear-interp-btn");
const ttsInterpBtn = document.getElementById("tts-interp-btn");
const micInterpBtn = document.getElementById("mic-interp-btn");
const copyTransBtn = document.getElementById("copy-translation-btn");
const useInChatBtn = document.getElementById("use-in-chat-btn");
const swapLangsBtn = document.getElementById("swap-langs-btn");
const cameraModal = document.getElementById("camera-modal");
const closeCameraBtn = document.getElementById("close-camera-btn");
const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");
const captureBtn = document.getElementById("capture-btn");
const uploadInsteadBtn = document.getElementById("upload-instead-btn");
const imgPreviewBar = document.getElementById("image-preview-bar");
const imgPreviewThumb = document.getElementById("img-preview-thumb");
const imgPreviewName = document.getElementById("img-preview-name");
const removeImgBtn = document.getElementById("remove-img-btn");
const apiStatusDot = document.getElementById("api-status-dot");
const apiStatusText = document.getElementById("api-status-text");
const langDetectedInfo = document.getElementById("lang-detected-info");
const chatTitle = document.getElementById("chat-title");
const toastContainer = document.getElementById("toast-container");

// ═══════════════════════════════════════════════════════════════════════════
// 1. ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

class FallingChar {
  constructor(canvasW, canvasH) {
    this.reset(canvasW, canvasH, true);
  }
  reset(w, h, initial = false) {
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h - h : -30;
    this.char = FALL_CHARS[Math.floor(Math.random() * FALL_CHARS.length)];
    this.speed = 0.4 + Math.random() * 1.0;
    this.opacity = 0.06 + Math.random() * 0.18;
    this.size = 10 + Math.random() * 16;
    this.drift = (Math.random() - 0.5) * 0.25;
    this.sway = Math.random() * Math.PI * 2;
    this.swayAmp = 0.3 + Math.random() * 0.7;
    this.swaySpeed = 0.005 + Math.random() * 0.01;
  }
}

let fallingChars = [];
let animFrameId = null;

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  fallingChars = Array.from({ length: 120 }, () => new FallingChar(canvas.width, canvas.height));
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle radial gradient overlay
  const grad = ctx.createRadialGradient(
    canvas.width * 0.5, canvas.height * 0.4, 0,
    canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.7
  );
  grad.addColorStop(0, "rgba(232,168,76,0.03)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const fc of fallingChars) {
    fc.sway += fc.swaySpeed;
    fc.x += Math.sin(fc.sway) * fc.swayAmp + fc.drift;
    fc.y += fc.speed;

    if (fc.y > canvas.height + 40) {
      fc.reset(canvas.width, canvas.height);
    }

    ctx.globalAlpha = fc.opacity;
    ctx.fillStyle = `hsl(${30 + Math.random() * 15},${60 + Math.random() * 20}%,${55 + Math.random() * 20}%)`;
    ctx.font = `${fc.size}px 'Noto Sans', 'Noto Sans Tamil', 'Noto Sans Devanagari', 'Noto Sans JP', serif`;
    ctx.fillText(fc.char, fc.x, fc.y);
    ctx.globalAlpha = 1;
  }

  animFrameId = requestAnimationFrame(drawBackground);
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(animFrameId);
  initCanvas();
  drawBackground();
});

initCanvas();
drawBackground();

// ═══════════════════════════════════════════════════════════════════════════
// 2. LANGUAGE DROPDOWNS (Interpreter)
// ═══════════════════════════════════════════════════════════════════════════

function populateLangDropdowns() {
  [fromLangSelect, toLangSelect].forEach((sel, i) => {
    sel.innerHTML = LANGUAGES.map(
      l => `<option value="${l.code}" ${(i === 0 && l.code === "English") || (i === 1 && l.code === "Tamil") ? "selected" : ""}>${l.name}</option>`
    ).join("");
  });
}
populateLangDropdowns();

// ═══════════════════════════════════════════════════════════════════════════
// 3. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.status === "ok" && data.api_key_set) {
      apiStatusDot.classList.remove("off");
      apiStatusText.textContent = `Connected · groq`;
    } else if (data.status === "ok" && !data.api_key_set) {
      apiStatusDot.classList.add("off");
      apiStatusText.textContent = "Backend up — set GROQ_API_KEY in .env";
      showToast("⚠️ Add your GROQ_API_KEY to backend/.env to enable AI features.", "error", 7000);
    } else {
      throw new Error("bad status");
    }
  } catch {
    apiStatusDot.classList.add("off");
    apiStatusText.textContent = "Backend offline — run uvicorn from backend/";
    showToast("Cannot reach backend. Run: uvicorn main:app --reload (in backend/)", "error", 8000);
  }
}
checkHealth();
setInterval(checkHealth, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// 4. TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function showToast(msg, type = "info", duration = 4000) {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHAT ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function hideWelcomeScreen() {
  if (welcomeScreen.parentNode === chatWindow) {
    chatWindow.removeChild(welcomeScreen);
  }
}

function createMessageRow(role, content, imgDataURL = null, langInfo = null) {
  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user-row" : "bot-row"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "👤" : "✈️";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (imgDataURL) {
    const img = document.createElement("img");
    img.className = "bubble-image";
    img.src = imgDataURL;
    img.alt = "Uploaded image";
    bubble.appendChild(img);
  }

  if (content) {
    if (role === "assistant") {
      bubble.innerHTML += renderMarkdown(content);
    } else {
      const p = document.createElement("p");
      p.textContent = content;
      bubble.appendChild(p);
    }
  }

  // Meta row
  const meta = document.createElement("div");
  meta.className = "bubble-meta";
  meta.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (langInfo && role === "user") {
    const badge = document.createElement("span");
    badge.className = "lang-badge";
    badge.textContent = langInfo.name;
    meta.appendChild(badge);
  }

  if (role === "assistant" && content) {
    const replayBtn = document.createElement("button");
    replayBtn.className = "tts-replay-btn";
    replayBtn.title = "Read aloud";
    replayBtn.textContent = "🔊";
    replayBtn.onclick = () => speakText(content);
    meta.appendChild(replayBtn);
  }

  bubble.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

function createSkeletonRow() {
  const row = document.createElement("div");
  row.className = "message-row bot-row";
  row.id = "skeleton-row";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "✈️";

  const skel = document.createElement("div");
  skel.className = "skeleton-bubble";
  skel.innerHTML = `<div class="skel-line"></div><div class="skel-line"></div><div class="skel-line"></div>`;

  row.appendChild(avatar);
  row.appendChild(skel);
  return row;
}

function scrollToBottom() {
  chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
}

// Simple markdown renderer
function renderMarkdown(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/((<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(?!<[h|u|l|p|b])(.+)$/, "<p>$1</p>");
}

async function sendMessage() {
  if (isSending) return;
  const text = msgInput.value.trim();
  if (!text && !selectedImageFile) return;

  isSending = true;
  sendBtn.disabled = true;

  hideWelcomeScreen();

  // Show user message
  const userRow = createMessageRow("user", text, selectedImageDataURL);
  chatWindow.appendChild(userRow);
  scrollToBottom();

  // Show skeleton
  const skelRow = createSkeletonRow();
  chatWindow.appendChild(skelRow);
  scrollToBottom();

  // Clear input
  const sentText = text;
  const sentFile = selectedImageFile;
  msgInput.value = "";
  autoResizeTextarea();
  clearImageSelection();

  try {
    const formData = new FormData();
    formData.append("message", sentText);
    formData.append("session_id", sessionId);
    if (sentFile) formData.append("image", sentFile);

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    skelRow.remove();

    // Update session
    if (data.session_id && data.session_id !== sessionId) {
      sessionId = data.session_id;
      localStorage.setItem("tourmind_session", sessionId);
    }

    // Update lang badge
    if (data.detected_lang) {
      lastDetectedLang = data.detected_lang;
      langDetectedInfo.textContent = `🌐 ${data.detected_lang.name}`;
    }

    // Show bot reply
    const botRow = createMessageRow("assistant", data.reply, null, null);
    chatWindow.appendChild(botRow);
    scrollToBottom();

    // TTS
    if (voiceEnabled && data.reply) {
      speakText(data.reply);
    }

    // Refresh history sidebar
    loadSessions();
    updateChatTitle(sentText);

  } catch (err) {
    skelRow.remove();
    const errRow = createMessageRow("assistant", `❌ ${err.message || "Something went wrong. Please try again."}`);
    chatWindow.appendChild(errRow);
    scrollToBottom();
    showToast(err.message || "Request failed.", "error");
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    msgInput.focus();
  }
}

function updateChatTitle(firstMsg) {
  if (chatTitle.textContent === "New Conversation" && firstMsg) {
    chatTitle.textContent = firstMsg.slice(0, 36) + (firstMsg.length > 36 ? "…" : "");
  }
}

// Suggestion cards
document.querySelectorAll(".suggestion-card").forEach(card => {
  card.addEventListener("click", () => {
    msgInput.value = card.dataset.query;
    autoResizeTextarea();
    sendMessage();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

sendBtn.addEventListener("click", sendMessage);

msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function autoResizeTextarea() {
  msgInput.style.height = "24px";
  msgInput.style.height = Math.min(msgInput.scrollHeight, 140) + "px";
}
msgInput.addEventListener("input", autoResizeTextarea);

// ═══════════════════════════════════════════════════════════════════════════
// 7. VOICE — SPEECH TO TEXT
// ═══════════════════════════════════════════════════════════════════════════

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = "Speech recognition not supported in this browser";
    return null;
  }
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-US";

  rec.onstart = () => {
    isRecording = true;
    micBtn.classList.add("recording");
    micBtn.title = "Listening… click to stop";
    showToast("🎤 Listening…", "info", 10000);
  };

  rec.onresult = (e) => {
    let interim = "";
    let final = "";
    for (const res of e.results) {
      if (res.isFinal) final += res[0].transcript;
      else interim += res[0].transcript;
    }
    msgInput.value = final || interim;
    autoResizeTextarea();
  };

  rec.onerror = (e) => {
    showToast(`Voice error: ${e.error}`, "error");
    stopRecording();
  };

  rec.onend = () => {
    stopRecording();
    if (msgInput.value.trim()) sendMessage();
  };

  return rec;
}

function stopRecording() {
  isRecording = false;
  micBtn.classList.remove("recording");
  micBtn.title = "Click to speak";
}

micBtn.addEventListener("click", () => {
  if (!recognition) {
    recognition = setupSpeechRecognition();
    if (!recognition) {
      showToast("Speech recognition not supported. Try Chrome or Edge.", "error");
      return;
    }
  }
  if (isRecording) {
    recognition.stop();
  } else {
    try { recognition.start(); }
    catch { recognition = setupSpeechRecognition(); recognition?.start(); }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. VOICE — TEXT TO SPEECH
// ═══════════════════════════════════════════════════════════════════════════

voiceToggleBtn.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  voiceToggleBtn.classList.toggle("active", voiceEnabled);
  voiceIcon.textContent = voiceEnabled ? "🔊" : "🔇";
  voiceLabel.textContent = voiceEnabled ? "Voice On" : "Voice Off";
  showToast(voiceEnabled ? "🔊 Voice output enabled" : "🔇 Voice output disabled", "info", 2000);
});

function speakText(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();

  // Strip markdown tags for TTS
  const cleaned = text.replace(/<[^>]+>/g, "").replace(/[*#`_]/g, "");
  const utt = new SpeechSynthesisUtterance(cleaned);

  // Try to pick voice matching detected language
  const voices = speechSynthesis.getVoices();
  const langCode = lastDetectedLang.code;
  const match = voices.find(v => v.lang.startsWith(langCode)) ||
    voices.find(v => v.lang.startsWith("en"));
  if (match) utt.voice = match;

  utt.rate = 0.95;
  utt.pitch = 1;
  utt.volume = 1;
  speechSynthesis.speak(utt);
}

// Load voices asynchronously
if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. IMAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function setImageSelection(file, dataURL) {
  selectedImageFile = file;
  selectedImageDataURL = dataURL;
  imgPreviewThumb.src = dataURL;
  imgPreviewName.textContent = file.name || "captured.jpg";
  imgPreviewBar.classList.add("visible");
}

function clearImageSelection() {
  selectedImageFile = null;
  selectedImageDataURL = null;
  imgPreviewThumb.src = "";
  imgPreviewBar.classList.remove("visible");
  fileInput.value = "";
}

removeImgBtn.addEventListener("click", clearImageSelection);

// File upload via file input
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => setImageSelection(file, e.target.result);
  reader.readAsDataURL(file);
});

// Camera button opens modal
cameraBtn.addEventListener("click", openCameraModal);

async function openCameraModal() {
  cameraModal.classList.add("open");
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    cameraVideo.srcObject = mediaStream;
  } catch (err) {
    showToast("Cannot access camera: " + err.message + ". Use file upload instead.", "error");
    closeCameraModal();
  }
}

function closeCameraModal() {
  cameraModal.classList.remove("open");
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  cameraVideo.srcObject = null;
}

closeCameraBtn.addEventListener("click", closeCameraModal);

captureBtn.addEventListener("click", () => {
  const w = cameraVideo.videoWidth || 640;
  const h = cameraVideo.videoHeight || 480;
  cameraCanvas.width = w;
  cameraCanvas.height = h;
  cameraCanvas.getContext("2d").drawImage(cameraVideo, 0, 0, w, h);
  cameraCanvas.toBlob(blob => {
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    const dataURL = cameraCanvas.toDataURL("image/jpeg");
    setImageSelection(file, dataURL);
    closeCameraModal();
    showToast("📸 Image captured!", "success", 2000);
  }, "image/jpeg", 0.9);
});

uploadInsteadBtn.addEventListener("click", () => {
  closeCameraModal();
  fileInput.click();
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. SIDEBAR & SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

toggleSidebarBtn.addEventListener("click", () => {
  isSidebarCollapsed = !isSidebarCollapsed;
  sidebar.classList.toggle("collapsed", isSidebarCollapsed);
  // Adjust interpreter panel for sidebar width
  interpreterPanel.style.left = isSidebarCollapsed ? "0" : `var(--sidebar-w)`;
});

// Mobile: close sidebar when clicking outside
document.addEventListener("click", e => {
  if (window.innerWidth <= 768 && sidebar.classList.contains("mobile-open")) {
    if (!sidebar.contains(e.target) && e.target !== toggleSidebarBtn) {
      sidebar.classList.remove("mobile-open");
    }
  }
});

if (window.innerWidth <= 768) {
  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });
}

newChatBtn.addEventListener("click", startNewChat);

function startNewChat() {
  sessionId = "";
  localStorage.removeItem("tourmind_session");
  chatTitle.textContent = "New Conversation";
  // Clear chat window and re-add welcome screen
  chatWindow.innerHTML = "";
  chatWindow.appendChild(welcomeScreen);
  clearImageSelection();
  msgInput.value = "";
  langDetectedInfo.textContent = "";
  document.querySelectorAll(".session-item").forEach(el => el.classList.remove("active"));
}

async function loadSessions() {
  try {
    const res = await fetch(`${API_BASE}/api/history`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const data = await res.json();
    renderSessionList(data.sessions || []);
  } catch {
    // Silently fail; backend might not be up yet
  }
}

function renderSessionList(sessions) {
  sessionList.innerHTML = "";
  if (!sessions.length) {
    sessionList.innerHTML = `<div style="padding:16px 18px;color:var(--text-muted);font-size:12px;">No previous chats yet.</div>`;
    return;
  }
  sessions.forEach(s => {
    const item = document.createElement("div");
    item.className = `session-item${s.session_id === sessionId ? " active" : ""}`;
    item.setAttribute("role", "listitem");

    const date = new Date(s.created_at + "Z");
    const relTime = formatRelativeTime(date);

    item.innerHTML = `
      <span class="session-icon">💬</span>
      <div class="session-info">
        <div class="session-title">${escapeHtml(s.title)}</div>
        <div class="session-meta">${s.message_count} msgs · ${relTime}</div>
      </div>
      <button class="session-delete" aria-label="Delete session" title="Delete">🗑</button>
    `;

    item.querySelector(".session-delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteSession(s.session_id);
    });

    item.addEventListener("click", () => loadSession(s.session_id));
    sessionList.appendChild(item);
  });
}

async function loadSession(sid) {
  try {
    const res = await fetch(`${API_BASE}/api/history/${sid}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const data = await res.json();
    sessionId = sid;
    localStorage.setItem("tourmind_session", sid);

    // Re-render chat
    chatWindow.innerHTML = "";
    if (!data.messages || !data.messages.length) {
      chatWindow.appendChild(welcomeScreen);
      return;
    }

    data.messages.forEach(m => {
      const row = createMessageRow(m.role, m.content);
      chatWindow.appendChild(row);
    });
    scrollToBottom();

    // Mark active
    document.querySelectorAll(".session-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".session-item").forEach(el => {
      if (el.querySelector(".session-title")?.textContent) {
        const info = el.querySelector(".session-info");
        if (info?.querySelector(".session-meta")?.textContent.includes(sid.slice(0, 4))) {
          el.classList.add("active");
        }
      }
    });

    chatTitle.textContent = data.messages.find(m => m.role === "user")?.content?.slice(0, 36) || "Chat";
  } catch {
    showToast("Failed to load session.", "error");
  }
}

async function deleteSession(sid) {
  try {
    await fetch(`${API_BASE}/api/history/${sid}`, { method: "DELETE" });
    if (sid === sessionId) startNewChat();
    loadSessions();
    showToast("🗑 Chat deleted.", "info", 2000);
  } catch {
    showToast("Failed to delete session.", "error");
  }
}

loadSessions();
setInterval(loadSessions, 15000);

// ═══════════════════════════════════════════════════════════════════════════
// 11. INTERPRETER MODE
// ═══════════════════════════════════════════════════════════════════════════

interpreterToggleBtn.addEventListener("click", () => {
  isInterpreterOpen = !isInterpreterOpen;
  interpreterPanel.classList.toggle("open", isInterpreterOpen);
  interpreterToggleBtn.classList.toggle("active", isInterpreterOpen);
  interpreterPanel.style.left = isSidebarCollapsed ? "0" : `var(--sidebar-w)`;
});

closeInterpBtn.addEventListener("click", () => {
  isInterpreterOpen = false;
  interpreterPanel.classList.remove("open");
  interpreterToggleBtn.classList.remove("active");
});

translateBtn.addEventListener("click", doTranslate);

async function doTranslate() {
  const text = interpInput.value.trim();
  if (!text) { showToast("Enter text to translate.", "info"); return; }

  translateBtn.disabled = true;
  translateBtn.textContent = "⏳ Translating…";
  interpOutput.value = "";

  try {
    const res = await fetch(`${API_BASE}/api/interpret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        from_lang: fromLangSelect.value,
        to_lang: toLangSelect.value,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    interpOutput.value = data.translation;
    if (voiceEnabled) speakText(data.translation);
  } catch (err) {
    showToast("Translation failed: " + err.message, "error");
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = "⚡ Translate";
  }
}

clearInterpBtn.addEventListener("click", () => {
  interpInput.value = "";
  interpOutput.value = "";
});

ttsInterpBtn.addEventListener("click", () => {
  const text = interpOutput.value.trim();
  if (!text) { showToast("Nothing to speak.", "info"); return; }
  speakText(text);
});

copyTransBtn.addEventListener("click", async () => {
  const text = interpOutput.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 Copied!", "success", 2000);
  } catch {
    showToast("Copy failed.", "error");
  }
});

useInChatBtn.addEventListener("click", () => {
  const text = interpOutput.value.trim();
  if (!text) return;
  msgInput.value = text;
  autoResizeTextarea();
  closeInterpBtn.click();
  msgInput.focus();
});

swapLangsBtn.addEventListener("click", () => {
  const fromVal = fromLangSelect.value;
  const toVal = toLangSelect.value;
  const fromText = interpInput.value;
  const toText = interpOutput.value;
  fromLangSelect.value = toVal;
  toLangSelect.value = fromVal;
  interpInput.value = toText;
  interpOutput.value = fromText;
});

// Voice input for interpreter
let interpRecog = null;
micInterpBtn.addEventListener("click", () => {
  if (!interpRecog) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast("Speech recognition not supported.", "error"); return; }
    interpRecog = new SR();
    interpRecog.continuous = false;
    interpRecog.interimResults = false;
    interpRecog.onresult = e => {
      interpInput.value = e.results[0][0].transcript;
    };
    interpRecog.onend = () => {
      micInterpBtn.classList.remove("recording");
      if (interpInput.value.trim()) doTranslate();
    };
  }
  micInterpBtn.classList.add("recording");
  interpRecog.start();
});

// Also allow Enter in interp input to translate
interpInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    doTranslate();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function escapeHtml(str) {
  return str?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "";
}

function formatRelativeTime(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
if (sessionId) loadSessions();
msgInput.focus();
