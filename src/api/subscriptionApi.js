import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

const SUBSCRIPTION_ENDPOINTS = {
  messenger: {
    subscribe: API_ENDPOINTS.MESSENGER.DIRECT_SUBSCRIPTION,
    unsubscribe: API_ENDPOINTS.MESSENGER.UNSUBSCRIPTION,
    idField: "page_id",
  },
  instagram: {
    subscribe: API_ENDPOINTS.INSTAGRAM.DIRECT_SUBSCRIPTION,
    unsubscribe: API_ENDPOINTS.INSTAGRAM.UNSUBSCRIPTION,
    idField: "instagram_id",
  },
  whatsapp: {
    subscribe: API_ENDPOINTS.WHATSAPP.DIRECT_SUBSCRIPTION,
    unsubscribe: API_ENDPOINTS.WHATSAPP.UNSUBSCRIPTION,
    idField: "whats_item_id",
  },
  telegram: {
    subscribe: API_ENDPOINTS.TELEGRAM.DIRECT_SUBSCRIPTION,
    unsubscribe: API_ENDPOINTS.TELEGRAM.UNSUBSCRIPTION,
    idField: "telegram_id",
  },
  tiktok: {
    subscribe: API_ENDPOINTS.TIKTOK.DIRECT_SUBSCRIPTION,
    unsubscribe: API_ENDPOINTS.TIKTOK.UNSUBSCRIPTION,
    idField: "tiktok_id",
  },
};

export const updateSubscription = (channel, resourceId, subscribe) => {
  const config = SUBSCRIPTION_ENDPOINTS[channel];
  if (!config) throw new Error(`Unsupported subscription channel: ${channel}`);
  return axiosInstance.post(config[subscribe ? "subscribe" : "unsubscribe"], {
    [config.idField]: resourceId,
  });
};
