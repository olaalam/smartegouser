import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const getInstagramAccounts = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.ACCOUNTS, { params });

export const getInstagramChatAccounts = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.CHAT_ACCOUNTS, { params });

export const getInstagramItems = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.ITEMS, { params });

export const getInstagramPackages = (lang = "en") =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.PACKAGES, { params: { lang } });

export const getInstagramConversations = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.CHAT_CONVERSATIONS, { params });

export const getInstagramMessages = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.INSTAGRAM.CHAT_MESSAGES, { params });

export const sendInstagramMessage = (body) =>
  axiosInstance.post(API_ENDPOINTS.INSTAGRAM.CHAT_SEND, body);

export const markInstagramRead = (body) =>
  axiosInstance.post(API_ENDPOINTS.INSTAGRAM.MARK_READ, { channel: "instagram", ...body });

export const getInstagramAIData = (body) =>
  axiosInstance.post(API_ENDPOINTS.INSTAGRAM.AI_DATA, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createInstagramOrder = (body) =>
  axiosInstance.post(API_ENDPOINTS.INSTAGRAM.ORDERS, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
