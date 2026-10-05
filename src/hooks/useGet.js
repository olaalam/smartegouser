import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";

/**
 * @param {string}  url      - API endpoint (relative to baseURL)
 * @param {object}  params   - optional extra query params e.g. { from, to }
 * @param {object}  options  - extra axios config
 *
 * Automatically injects `lang` from Redux ui state into every request.
 */
export const useGet = (url, params = {}, options = {}) => {
  const lang = useSelector((s) => s.ui.lang);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Re-fetch whenever url, params, or lang changes
  const paramsKey = JSON.stringify({ ...params, lang });

  const fetchData = useCallback(
    async (controller) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(url, {
          params: { lang, ...params },
          signal: controller?.signal,
          ...options,
        });
        setData(response.data);
        return response.data;
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.message || (lang === "ar" ? "فشل تحميل البيانات." : "Failed to load data."));
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, paramsKey]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller);
    return () => controller.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData() };
};
