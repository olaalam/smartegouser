import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

// 1. توليد رابط تفويض تيك توك OAuth
export const getTikTokAuthUrl = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.AUTH_URL, { params });

// 2. ربط حساب جديد (يدعم FormData أو JSON)
export const connectTikTokAccount = (data) => {
  const isFormData = data instanceof FormData;
  return axiosInstance.post(
    API_ENDPOINTS.TIKTOK.CONNECT,
    data,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
};

// 3. جلب جميع الحسابات المرتبطة
export const getTikTokAccounts = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.ACCOUNTS, { params });

// 4. تفاصيل حساب محدد
export const getTikTokAccount = (id) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.ACCOUNT_DETAIL(id));

// 5. تحديث بيانات الـ AI والروابط والحالة
export const updateTikTokAccount = (id, data) => {
  const isFormData = data instanceof FormData;
  return axiosInstance.post(
    API_ENDPOINTS.TIKTOK.ACCOUNT_DETAIL(id),
    data,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
};

// 6. تجديد توكن الوصول يدوياً
export const refreshTikTokToken = (id) =>
  axiosInstance.post(API_ENDPOINTS.TIKTOK.REFRESH_TOKEN(id));

// 7. فصل وحذف الحساب
export const disconnectTikTokAccount = (id) =>
  axiosInstance.delete(API_ENDPOINTS.TIKTOK.DISCONNECT(id));

// 8. جلب حسابات الشات مع عداد غير المقروء
export const getTikTokChatAccounts = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.CHAT_ACCOUNTS, { params });

// 9. جلب قائمة محادثات العملاء
export const getTikTokConversations = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.CHAT_CONVERSATIONS, { params });

// 10. جلب رسائل محادثة عميل محدد (يقوم السيرفر تلقائياً بتعليمها كمقروءة)
export const getTikTokMessages = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.TIKTOK.CHAT_MESSAGES, { params });

// 11. إرسال رد يدوي من الموظف للعميل
export const sendTikTokReply = (body) =>
  axiosInstance.post(API_ENDPOINTS.TIKTOK.CHAT_SEND, body);

