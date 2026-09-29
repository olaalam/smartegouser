const API_LABELS = {
  active: { en: "Active", ar: "نشط" },
  activated: { en: "Activated", ar: "مفعّل" },
  approved: { en: "Approved", ar: "مقبول" },
  connected: { en: "Connected", ar: "متصل" },
  disconnected: { en: "Not connected", ar: "غير متصل" },
  expired: { en: "Expired", ar: "منتهي" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  pending: { en: "Pending", ar: "معلق" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  subscribed: { en: "Subscribed", ar: "مشترك" },
  "not subscribed": { en: "Not subscribed", ar: "غير مشترك" },
  "no subscription": { en: "No subscription", ar: "بدون اشتراك" },
  unsubscribed: { en: "Not subscribed", ar: "غير مشترك" },
  admin: { en: "Admin", ar: "مدير" },
  owner: { en: "Owner", ar: "مالك" },
  user: { en: "User", ar: "مستخدم" },
};

export function localizeApiLabel(value, lang, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") {
    return value
      ? (lang === "ar" ? "نشط" : "Active")
      : (lang === "ar" ? "غير نشط" : "Inactive");
  }
  const raw = String(value).trim();
  const key = raw.toLowerCase().replace(/[_-]+/g, " ");
  return API_LABELS[key]?.[lang] ?? raw;
}