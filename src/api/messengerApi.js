import axiosInstance from "./axiosInstance";

// ── 1. List all Facebook Pages ──────────────────────────────────────────────
export const getMessengerPages = (params = {}) =>
  axiosInstance.get("user/chat/messenger/pages", { params });

// ── 2. List conversations for a specific page ────────────────────────────────
export const getMessengerConversations = (params = {}) =>
  axiosInstance.get("user/chat/messenger/conversations", { params });

// ── 3. Get message history for a conversation ────────────────────────────────
export const getMessengerMessages = (params = {}) =>
  axiosInstance.get("user/chat/messenger/messages", { params });

// ── 4. Send a reply to a Messenger customer ──────────────────────────────────
export const sendMessengerMessage = (body) =>
  axiosInstance.post("user/chat/messenger/send", body);

// ── 5. Mark conversation as read ─────────────────────────────────────────────
export const markMessengerRead = (body) =>
  axiosInstance.post("user/chat/mark-as-read", { channel: "messenger", ...body });

export const getMessengerAIData = (pageId) =>
  axiosInstance.post("user/messenger/ai_data", { page_id: pageId });
