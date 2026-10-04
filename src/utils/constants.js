export const API_ENDPOINTS = {
  AUTH: {
    FACEBOOK: "auth/facebook",
    LOGOUT:   "auth/logout",
  },
  USER: {
    DASHBOARD:      "user/dashboard",
    PROFILE:        "user",
    ALL_CHATS:      "user/all_chats",
    HISTORY_ORDERS: "user/history_orders",
    PENDING_ORDERS: "user/pending_orders",
  },
  MESSENGER: {
    PACKAGES: "user/messenger/facebook_packages",
    PAGES:    "user/messenger/pages",
    ORDERS:   "user/messenger/orders",
    AI_DATA:  "user/messenger/ai_data",
  },
  INSTAGRAM: {
    ACCOUNTS: "user/instagram/accounts",
    ITEMS:    "user/instagram/items",
    PACKAGES: "user/instagram/packages",
    ORDERS:   "user/instagram/orders",
    AI_DATA:  "user/instagram/ai_data",
    CHAT_ACCOUNTS:       "user/chat/instagram/accounts",
    CHAT_CONVERSATIONS:  "user/chat/instagram/conversations",
    CHAT_MESSAGES:       "user/chat/instagram/messages",
    CHAT_SEND:           "user/chat/instagram/send",
    MARK_READ:           "user/chat/mark-as-read",
  },
  WHATSAPP: {
    ITEMS:    "user/whats/items",
    AI_DATA:  "user/whats/ai_data",
    PACKAGES: "user/whats/packages",
    ORDERS:   "user/whats/orders",
  },
};
