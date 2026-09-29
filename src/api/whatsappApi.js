import axiosInstance from "./axiosInstance";

// ── 1. List all WhatsApp Numbers ─────────────────────────────────────────────
// GET /api/user/chat/whatsapp/numbers
export const getWhatsAppNumbers = (params = {}) =>
  axiosInstance.get("user/chat/whatsapp/numbers", { params });

// Aliased for backward compatibility
export const getWhatsAppPages = getWhatsAppNumbers;

// ── 2. List conversations for a specific WhatsApp number ─────────────────────
// GET /api/user/chat/whatsapp/conversations?whats_item_id={id}
export const getWhatsAppConversations = (params = {}) =>
  axiosInstance.get("user/chat/whatsapp/conversations", { params });

// ── 3. Get message history for a conversation ─────────────────────────────────
// GET /api/user/chat/whatsapp/messages?whats_item_id={id}&phone={phone}
export const getWhatsAppMessages = (params = {}) =>
  axiosInstance.get("user/chat/whatsapp/messages", { params });

// ── 4. Send a reply to a WhatsApp customer ────────────────────────────────────
// POST /api/user/chat/whatsapp/send
// Body: { whats_item_id, phone, message }
export const sendWhatsAppMessage = (body) =>
  axiosInstance.post("user/chat/whatsapp/send", body);

// ── 5. Mark conversation as read ─────────────────────────────────────────────
// POST /api/user/chat/mark-as-read
// Body: { channel: "whatsapp", whats_item_id, phone }
export const markWhatsAppRead = (body) =>
  axiosInstance.post("user/chat/mark-as-read", { channel: "whatsapp", ...body });

export const getWhatsAppAIData = (id) =>
  axiosInstance.get(`user/whats/ai_data/${encodeURIComponent(id)}`);
