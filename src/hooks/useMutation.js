import { useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";

export const useMutation = () => {
  const lang = useSelector((state) => state.ui.lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (url, method = "PUT", payload = {}, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance({
        url,
        method,
        data: payload,
        ...config,
      });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || (lang === "ar" ? "فشلت عملية التعديل" : "The changes could not be saved.");
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
