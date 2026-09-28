/**
 * echoService.js
 * Initialises Laravel Echo once and re-uses the same instance across the app.
 * Backend: Reverb (compatible with Pusher JS client)
 * Host  : bcknd.smartego.org   (port 8080 / ws)
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;
Pusher.logToConsole = true; // 👈 تفعيل اللوجز الداخلية بتاعت Pusher عشان نشوف بيعمل Subscribe ولا لا

let echoInstance = null;

export function getEcho() {
  if (echoInstance) return echoInstance;

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: "2yxqhjtlmsrbravhwyrg",
    wsHost: "bcknd.smartego.org",
    wsPort: 8080,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
    disableStats: true,
  });

  echoInstance.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Connected to Reverb Successfully!');
  });
  
  echoInstance.connector.pusher.connection.bind('error', (err) => {
    console.error('❌ Reverb Connection Error:', err);
  });

  // 👇 إضافة هذا السطر لمراقبة كل الأحداث القادمة من السيرفر
  echoInstance.connector.pusher.bind_global((eventName, data) => {
    console.log(`🔔 Global Event Received [${eventName}]:`, data);
  });

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
