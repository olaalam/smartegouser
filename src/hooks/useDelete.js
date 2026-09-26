import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export const useDelete = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = async (url, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.delete(url, config);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || "فشلت عملية الحذف";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};