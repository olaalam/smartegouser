const CONNECTION_KEYS = {
  facebook: "facebook_connected",
  whatsapp: "whatsapp_connected",
};

export function isChannelConnected(channel) {
  const key = CONNECTION_KEYS[channel];
  return key ? localStorage.getItem(key) === "true" : false;
}

export function saveChannelConnection(channel) {
  const key = CONNECTION_KEYS[channel];
  if (!key) throw new Error(`Unknown channel: ${channel}`);
  localStorage.setItem(key, "true");
}

export function clearChannelConnections() {
  Object.values(CONNECTION_KEYS).forEach((key) => localStorage.removeItem(key));
}
