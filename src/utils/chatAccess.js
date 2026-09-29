const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "approved", "subscribed", "activated"]);

export function hasChatAccess(resource) {
  if (resource?.subscription_status === true) return true;
  const status = String(resource?.subscription_status ?? "").trim().toLowerCase();
  return status === "true" || ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

export function formatAvailableMessages(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : String(value);
}