import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Link2, MessageCircle, MessageSquare, Phone } from "lucide-react";
import Navbar from "./Navbar";
import { useGet } from "../../hooks/useGet";
import { API_ENDPOINTS } from "../../utils/constants";

const navigation = [
  { to: "/dashboard", label: { en: "Dashboard", ar: "لوحة التحكم" }, icon: LayoutDashboard },
  { to: "/connect", label: { en: "Connect accounts", ar: "ربط الحسابات" }, icon: Link2 },
  { to: "/user-orders", label: { en: "User Orders", ar: "طلبات المستخدم" }, icon: ClipboardList },
];

export default function AppLayout({ children }) {
  const lang = useSelector((state) => state.ui.lang);
  const location = useLocation();
  const { data: allChatsResponse, loading: chatsLoading, error: chatsError } = useGet(API_ENDPOINTS.USER.ALL_CHATS);
  const allChats = allChatsResponse?.data ?? allChatsResponse ?? {};
  const chatChannels = [
    {
      to: "/chats?channel=messenger",
      label: { en: "Messenger", ar: "ماسنجر" },
      icon: MessageSquare,
      items: Array.isArray(allChats.messenger_pages)
        ? allChats.messenger_pages.filter((item) => item.subscription_status === true)
        : [],
      itemLabel: (item) => item.page_name || item.page_id,
      itemTo: (item) => `/chats?channel=messenger&pageId=${encodeURIComponent(item.page_id)}`,
    },
    {
      to: "/chats?channel=instagram",
      label: { en: "Instagram", ar: "إنستغرام" },
      icon: Camera,
      items: Array.isArray(allChats.instagram_pages)
        ? allChats.instagram_pages.filter((item) => item.subscription_status === true)
        : [],
      itemLabel: (item) => item.username ? `@${item.username}` : item.name || item.instagram_id,
      itemTo: (item) => `/chats?channel=instagram&instagramId=${encodeURIComponent(item.instagram_id)}`,
    },
    {
      to: "/chats?channel=whatsapp",
      label: { en: "WhatsApp", ar: "واتساب" },
      icon: Phone,
      items: Array.isArray(allChats.whats_accounts)
        ? allChats.whats_accounts.filter((item) => item.subscription_status === true)
        : [],
      itemLabel: (item) => item.phone || String(item.id),
      itemTo: (item) => `/chats?channel=whatsapp&whatsItemId=${encodeURIComponent(item.id)}`,
    },
  ].filter(({ items }) => items.length > 0);
  const isRTL = lang === "ar";
  const [isExpanded, setIsExpanded] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const ToggleIcon = isExpanded
    ? (isRTL ? ChevronRight : ChevronLeft)
    : (isRTL ? ChevronLeft : ChevronRight);
  const toggleLabel = isExpanded
    ? (isRTL ? "إغلاق القائمة الجانبية" : "Collapse sidebar")
    : (isRTL ? "فتح القائمة الجانبية" : "Expand sidebar");

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {isExpanded && (
        <button
          type="button"
          aria-label={isRTL ? "إغلاق القائمة الجانبية" : "Close sidebar"}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      <aside className={`sticky top-0 z-50 flex h-screen shrink-0 flex-col border-e border-[var(--border)] bg-[var(--card)] py-4 transition-[width] duration-200 ${isExpanded ? "w-56 px-3 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:shadow-xl" : "w-14 px-2"}`}>
        <div className={`mb-6 flex items-center gap-2 ${isExpanded ? "justify-between" : "flex-col"}`}>
          <div className="flex h-9 min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "var(--primary)" }}>S</span>
            {isExpanded && <span className="truncate text-sm font-semibold text-[var(--foreground)]">SmartEgo</span>}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ToggleIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={isRTL ? "التنقل الرئيسي" : "Main navigation"} className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = to === "/fb-pages"
              ? location.pathname.startsWith(to)
              : location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                title={label[lang] ?? label.en}
                className={`flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${active
                  ? "bg-[var(--accent)] font-semibold text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {isExpanded && <span className="truncate">{label[lang] ?? label.en}</span>}
              </NavLink>
            );
          })}
          {(chatChannels.length > 0 || chatsLoading || chatsError) && (
          <div className="pt-3">
            {isExpanded && (chatChannels.length > 0 || chatsLoading || chatsError) && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {lang === "ar" ? "المحادثات" : "Chats"}
              </p>
            )}
            {chatChannels.map(({ id, to, label, icon: Icon, items, itemLabel, itemTo }) => {
              const active = location.pathname === "/chats"
                && new URLSearchParams(location.search).get("channel") === id;
              return (
                <div key={to}>
                  <NavLink
                    to={to}
                    title={label[lang] ?? label.en}
                    className={`flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${active
                      ? "bg-[var(--accent)] font-semibold text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {isExpanded && <span className="truncate">{label[lang] ?? label.en}</span>}
                  </NavLink>
                  {isExpanded && items.map((item) => {
                    const itemPath = itemTo(item);
                    const itemActive = `${location.pathname}${location.search}` === itemPath;
                    return (
                      <NavLink
                        key={item.page_id ?? item.instagram_id ?? item.id}
                        to={itemPath}
                        title={itemLabel(item)}
                        className={`ms-7 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs transition-colors ${itemActive
                          ? "bg-[var(--accent)] font-medium text-[var(--primary)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                        aria-current={itemActive ? "page" : undefined}
                      >
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{itemLabel(item)}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
            {isExpanded && chatsError && (
              <p role="status" className="px-3 py-2 text-xs text-[var(--destructive)]">
                {lang === "ar" ? "تعذر تحميل المحادثات." : "Could not load chats."}
              </p>
            )}
            {isExpanded && chatsLoading && (
              <p role="status" className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                {lang === "ar" ? "جارٍ تحميل المحادثات..." : "Loading chats..."}
              </p>
            )}
          </div>
          )}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Navbar />
        {children}
      </div>
    </div>
  );
}