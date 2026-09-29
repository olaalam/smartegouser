import { useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";

export const useDelete = () => {
  const lang = useSelector((state) => state.ui.lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = async (url, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.delete(url, config);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || (lang === "ar" ? "فشلت عملية الحذف" : "The item could not be deleted.");
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};