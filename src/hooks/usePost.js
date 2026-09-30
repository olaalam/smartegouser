import { useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";

export const usePost = () => {
  const lang = useSelector((state) => state.ui.lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (url, payload, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(url, payload, config);
      return { success: true, data: response.data };
    } catch (err) {
      // التحقق من كافة المفاتيح المحتملة لرسالة الخطأ في استجابة السيرفر
      const errorData = err.response?.data;
      const message = 
        errorData?.message || 
        errorData?.error || 
        errorData?.msg || 
        err.message || 
        (lang === "ar" ? "فشلت عملية الإرسال" : "The request could not be sent.");

      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};