import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Link2, MessageCircle, MessageSquare, Phone } from "lucide-react";
import Navbar from "./Navbar";
import { useGet } from "../../hooks/useGet";
import { getEcho } from "../../api/echoService";
import { getInstagramChatAccounts, getInstagramConversations } from "../../api/instagramApi";
import { getMessengerConversations } from "../../api/messengerApi";
import { getWhatsAppConversations } from "../../api/whatsappApi";
import { API_ENDPOINTS } from "../../utils/constants";
import { CHAT_ACTIVE_EVENT, CHAT_READ_EVENT } from "../../utils/chatUnreadEvents";

const subscribedItems = (items) => Array.isArray(items)
  ? items.filter((item) => item.subscription_status === true)
  : [];

const dataList = (response) => response.data?.data ?? [];
const unreadValue = (value) => Math.max(0, Number(value) || 0);

const navigation = [
  { to: "/dashboard", label: { en: "Dashboard", ar: "لوحة التحكم" }, icon: LayoutDashboard },
  { to: "/connect", label: { en: "Connect accounts", ar: "ربط الحسابات" }, icon: Link2 },
  { to: "/user-orders", label: { en: "User Orders", ar: "طلبات المستخدم" }, icon: ClipboardList },
];

export default function AppLayout({ children }) {
  const lang = useSelector((state) => state.ui.lang);
  const location = useLocation();
  const { data: allChatsResponse, loading: chatsLoading, error: chatsError, refetch: refetchChats } = useGet(API_ENDPOINTS.USER.ALL_CHATS);
  const allChats = allChatsResponse?.data ?? allChatsResponse ?? {};
  const [unreadUpdates, setUnreadUpdates] = useState({ response: null, deltas: {} });
  const activeChatRef = useRef(null);
  const refetchChatsRef = useRef(refetchChats);

  useEffect(() => {
    refetchChatsRef.current = refetchChats;
  }, [refetchChats]);

  useEffect(() => {
    const activeChatListener = (event) => {
      activeChatRef.current = event.detail ?? null;
    };
    const chatReadListener = () => refetchChatsRef.current();
    window.addEventListener(CHAT_ACTIVE_EVENT, activeChatListener);
    window.addEventListener(CHAT_READ_EVENT, chatReadListener);
    return () => {
      window.removeEventListener(CHAT_ACTIVE_EVENT, activeChatListener);
      window.removeEventListener(CHAT_READ_EVENT, chatReadListener);
    };
  }, []);

  useEffect(() => {
    if (!allChatsResponse) return undefined;
    let cancelled = false;
    const echo = getEcho();
    const channelNames = new Set();
    const seenMessages = new Set();

    const subscribeConversations = async ({ channel, accountId, conversationsRequest, channelPrefix, eventName, senderField }) => {
      try {
        const response = await conversationsRequest();
        if (cancelled) return;
        for (const conversation of dataList(response)) {
          const senderId = conversation[senderField];
          if (!senderId) continue;
          const channelName = `${channelPrefix}${senderId}_${accountId}`;
          if (channelNames.has(channelName)) continue;
          channelNames.add(channelName);
          echo.channel(channelName).listen(eventName, (event) => {
            const message = event.message && typeof event.message === "object" ? event.message : event;
            const adminFlag = message.is_admin;
            const isAdmin = adminFlag === true
              || adminFlag === 1
              || ["true", "1"].includes(String(adminFlag).toLowerCase())
              || String(message.sender_type).toLowerCase() === "admin";
            if (isAdmin) return;
            const messageId = message.id ?? message.message_id;
            if (messageId !== undefined && messageId !== null) {
              const dedupeKey = `${channelName}:${messageId}`;
              if (seenMessages.has(dedupeKey)) return;
              seenMessages.add(dedupeKey);
            }
            const activeChat = activeChatRef.current;
            if (
              activeChat?.channel === channel
              && String(activeChat.accountId) === String(accountId)
              && String(activeChat.senderId) === String(senderId)
            ) return;

            const itemKey = `${channel}:${accountId}`;
            setUnreadUpdates((current) => {
              const deltas = current.response === allChatsResponse ? current.deltas : {};
              return {
                response: allChatsResponse,
                deltas: { ...deltas, [itemKey]: (deltas[itemKey] ?? 0) + 1 },
              };
            });
          });
        }
      } catch (error) {
        console.error(`Could not subscribe to ${channel} unread message events for ${accountId}`, error);
      }
    };

    const requests = [];
    let instagramAccountsPromise;
    const getInstagramAccounts = () => {
      if (!instagramAccountsPromise) {
        instagramAccountsPromise = getInstagramChatAccounts({ per_page: 100, paginate: 0 })
          .then(dataList);
      }
      return instagramAccountsPromise;
    };
    for (const page of subscribedItems(allChats.messenger_pages)) {
      requests.push(subscribeConversations({
        channel: "messenger",
        accountId: page.page_id,
        conversationsRequest: () => getMessengerConversations({ page_id: page.page_id }),
        channelPrefix: "userChat_",
        eventName: ".UserChatEvent",
        senderField: "sender_id",
      }));
    }
    for (const account of subscribedItems(allChats.instagram_pages)) {
      requests.push((async () => {
        try {
          const matchedAccount = account.id || account.instagram_item_id
            ? account
            : (await getInstagramAccounts()).find((item) =>
              String(item.instagram_id) === String(account.instagram_id)
            );
          const itemId = account.id ?? account.instagram_item_id ?? matchedAccount?.id ?? matchedAccount?.instagram_item_id;
          if (!itemId) throw new Error(`Instagram item ID not found for ${account.instagram_id}`);
          await subscribeConversations({
            channel: "instagram",
            accountId: account.instagram_id,
            conversationsRequest: () => getInstagramConversations({
              instagram_item_id: itemId,
              page: 1,
              per_page: 100,
              paginate: 0,
            }),
            channelPrefix: "userInsta_",
            eventName: ".UserChatEvent",
            senderField: "sender_id",
          });
        } catch (error) {
          console.error(`Could not load Instagram unread conversations for ${account.instagram_id}`, error);
        }
      })());
    }
    for (const account of subscribedItems(allChats.whats_accounts)) {
      requests.push(subscribeConversations({
        channel: "whatsapp",
        accountId: account.id,
        conversationsRequest: () => getWhatsAppConversations({
          whats_item_id: account.id,
          page: 1,
          per_page: 100,
          paginate: 0,
        }),
        channelPrefix: "userWhats_",
        eventName: ".MessageSent",
        senderField: "phone",
      }));
    }

    Promise.all(requests).catch((error) => {
      console.error("Could not initialize sidebar unread message subscriptions", error);
    });
    return () => {
      cancelled = true;
      for (const channelName of channelNames) echo.leave(channelName);
    };
  }, [allChatsResponse, allChats.messenger_pages, allChats.instagram_pages, allChats.whats_accounts]);

  const chatChannels = [
    {
      id: "messenger",
      to: "/chats?channel=messenger",
      label: { en: "Messenger", ar: "ماسنجر" },
      icon: MessageSquare,
      items: subscribedItems(allChats.messenger_pages),
      itemLabel: (item) => item.page_name || item.page_id,
      itemTo: (item) => `/chats?channel=messenger&pageId=${encodeURIComponent(item.page_id)}`,
      itemKey: (item) => `messenger:${item.page_id}`,
    },
    {
      id: "instagram",
      to: "/chats?channel=instagram",
      label: { en: "Instagram", ar: "إنستغرام" },
      icon: Camera,
      items: subscribedItems(allChats.instagram_pages),
      itemLabel: (item) => item.username ? `@${item.username}` : item.name || item.instagram_id,
      itemTo: (item) => `/chats?channel=instagram&instagramId=${encodeURIComponent(item.instagram_id)}`,
      itemKey: (item) => `instagram:${item.instagram_id}`,
    },
    {
      id: "whatsapp",
      to: "/chats?channel=whatsapp",
      label: { en: "WhatsApp", ar: "واتساب" },
      icon: Phone,
      items: subscribedItems(allChats.whats_accounts),
      itemLabel: (item) => item.phone || String(item.id),
      itemTo: (item) => `/chats?channel=whatsapp&whatsItemId=${encodeURIComponent(item.id)}`,
      itemKey: (item) => `whatsapp:${item.id}`,
    },
  ].filter(({ items }) => items.length > 0);
  const getUnreadCount = (itemKey, baseValue) => {
    const realtimeDelta = unreadUpdates.response === allChatsResponse
      ? unreadUpdates.deltas[itemKey] ?? 0
      : 0;
    return Math.max(0, unreadValue(baseValue) + realtimeDelta);
  };
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
            {chatChannels.map(({ id, to, label, icon: Icon, items, itemLabel, itemTo, itemKey }) => {
              const active = location.pathname === "/chats"
                && new URLSearchParams(location.search).get("channel") === id;
              const channelUnread = items.reduce((total, item) => total + getUnreadCount(itemKey(item), item.unread_count), 0);
              return (
                <div key={to}>
                  <NavLink
                    to={to}
                    title={label[lang] ?? label.en}
                    className={`relative flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${active
                      ? "bg-[var(--accent)] font-semibold text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {isExpanded && <span className="truncate">{label[lang] ?? label.en}</span>}
                    {channelUnread > 0 && (
                      <span
                        aria-label={`${channelUnread} ${lang === "ar" ? "رسالة غير مقروءة" : "unread messages"}`}
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm ${isExpanded ? "ms-auto" : "absolute -end-1 -top-1"}`}
                      >
                        {channelUnread > 99 ? "99+" : channelUnread}
                      </span>
                    )}
                  </NavLink>
                  {isExpanded && items.map((item) => {
                    const itemPath = itemTo(item);
                    const itemActive = `${location.pathname}${location.search}` === itemPath;
                    const itemUnread = getUnreadCount(itemKey(item), item.unread_count);
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
                        {itemUnread > 0 && (
                          <span
                            aria-label={`${itemUnread} ${lang === "ar" ? "رسالة غير مقروءة" : "unread messages"}`}
                            className="ms-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm"
                          >
                            {itemUnread > 99 ? "99+" : itemUnread}
                          </span>
                        )}
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