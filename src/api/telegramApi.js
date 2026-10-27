import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const connectTelegramBot = (formData) =>
  axiosInstance.post(API_ENDPOINTS.TELEGRAM.CONNECT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getTelegramAccounts = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TELEGRAM.ACCOUNTS, { params });

export const getTelegramConversations = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TELEGRAM.CONVERSATIONS, { params });

export const getTelegramMessages = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TELEGRAM.MESSAGES, { params });

export const sendTelegramReply = (body) =>
  axiosInstance.post(API_ENDPOINTS.TELEGRAM.SEND, body);

export const markTelegramRead = (body) =>
  axiosInstance.post(API_ENDPOINTS.TELEGRAM.MARK_READ, { channel: "telegram", ...body });
