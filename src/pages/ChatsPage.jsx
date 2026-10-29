import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import MessengerChatPage from "./MessengerChatPage";
import InstagramChatPage from "./InstagramChatPage";
import WhatsAppChatPage from "./WhatsAppChatPage";
import TelegramChatPage from "./TelegramChatPage";
import TikTokChatPage from "./TikTokChatPage";

const CHANNELS = [
  { id: "messenger", label: { en: "Messenger", ar: "ماسنجر" }, logo: FacebookLogo, color: "#1877f2" },
  { id: "instagram", label: { en: "Instagram", ar: "إنستغرام" }, logo: InstagramLogo, color: "#e1306c" },
  { id: "whatsapp", label: { en: "WhatsApp", ar: "واتساب" }, logo: WhatsAppLogo, color: "#00a884" },
  { id: "telegram", label: { en: "Telegram", ar: "تيليجرام" }, logo: TelegramLogo, color: "#229ED9" },
  { id: "tiktok", label: { en: "TikTok", ar: "تيك توك" }, logo: TikTokLogo, color: "#FE2C55" },
];

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.02 4.388 11.017 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.03 1.792-4.704 4.533-4.704 1.312 0 2.686.237 2.686.237v2.974H15.83c-1.491 0-1.956.93-1.956 1.888v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.09 24 18.093 24 12.073Z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.83 11.83 0 0 0-3.43-8.43ZM12.06 21.8h-.01a9.9 9.9 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.89-9.88 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.18.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function TelegramLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.96 6.78-1.53 7.18c-.11.52-.42.65-.84.4l-2.3-1.7-1.1 1.05c-.12.12-.22.22-.46.22l.17-2.38 4.35-3.92c.19-.17-.04-.26-.29-.09l-5.38 3.39-2.31-.72c-.5-.16-.51-.5.11-.74l8.96-3.45c.42-.15.78.1.65.73Z" />
    </svg>
  );
}

function TikTokLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V8.47a8.28 8.28 0 0 0 4.84 1.55V6.69h-.93z" />
    </svg>
  );
}

const CHAT_PAGES = {
  messenger: MessengerChatPage,
  instagram: InstagramChatPage,
  whatsapp: WhatsAppChatPage,
  telegram: TelegramChatPage,
  tiktok: TikTokChatPage,
};

export default function ChatsPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedChannel = searchParams.get("channel");
  const activeChannel = CHAT_PAGES[requestedChannel] ? requestedChannel : "messenger";
  const ActiveChatPage = CHAT_PAGES[activeChannel];

  const selectChannel = (channel) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("channel", channel);
      return next;
    });
  };

  return (
    <main
      className="flex h-[calc(100dvh-4.5rem)] min-h-[580px] flex-col gap-2 bg-[var(--background)] p-2"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        role="tablist"
        aria-label={isRTL ? "قنوات المحادثات" : "Chat channels"}
        className="flex shrink-0 gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 overflow-x-auto"
      >
        {CHANNELS.map(({ id, label, logo: Logo, color }) => {
          const selected = activeChannel === id;
          return (
            <button
              key={id}
              id={`chat-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="chat-channel-panel"
              onClick={() => selectChannel(id)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-[var(--accent)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  color: selected ? "#fff" : color,
                  backgroundColor: selected ? color : `${color}18`,
                }}
              >
                <Logo />
              </span>
              {label[lang] ?? label.en}
            </button>
          );
        })}
      </div>

      <section
        id="chat-channel-panel"
        role="tabpanel"
        aria-labelledby={`chat-tab-${activeChannel}`}
        className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--border)]"
      >
        <ActiveChatPage embedded />
      </section>
    </main>
  );
}
