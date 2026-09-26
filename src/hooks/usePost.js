import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (url, payload, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(url, payload, config);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || "فشلت عملية الإرسال";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};