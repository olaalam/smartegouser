export const CHAT_ACTIVE_EVENT = "smartego:chat-active";
export const CHAT_READ_EVENT = "smartego:chat-read";

export function publishActiveChat(detail) {
  window.dispatchEvent(new CustomEvent(CHAT_ACTIVE_EVENT, { detail }));
}

export function publishChatRead() {
  window.dispatchEvent(new Event(CHAT_READ_EVENT));
}
