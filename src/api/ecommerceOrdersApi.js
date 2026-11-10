import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const getEcommerceOrders = (params = {}) =>
  axiosInstance.get(API_ENDPOINTS.USER.ECOMMERCE_ORDERS, { params });

export const getEcommerceOrder = (id) =>
  axiosInstance.get(`${API_ENDPOINTS.USER.ECOMMERCE_ORDERS}/${encodeURIComponent(id)}`);

export const resendEcommerceOrderConfirmation = (id) =>
  axiosInstance.post(`${API_ENDPOINTS.USER.ECOMMERCE_ORDERS}/${encodeURIComponent(id)}/resend`);
