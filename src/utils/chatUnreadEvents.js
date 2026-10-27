export const CHAT_ACTIVE_EVENT = "smartego:chat-active";
export const CHAT_READ_EVENT = "smartego:chat-read";
export const TELEGRAM_ACCOUNTS_UPDATED_EVENT = "smartego:telegram-accounts-updated";

export function publishActiveChat(detail) {
  window.dispatchEvent(new CustomEvent(CHAT_ACTIVE_EVENT, { detail }));
}

export function publishChatRead() {
  window.dispatchEvent(new Event(CHAT_READ_EVENT));
}

export function publishTelegramAccountsUpdated() {
  window.dispatchEvent(new Event(TELEGRAM_ACCOUNTS_UPDATED_EVENT));
}
