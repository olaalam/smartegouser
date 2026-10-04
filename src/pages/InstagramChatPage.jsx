import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Check, CheckCheck, CreditCard,
  LoaderCircle, MessageCircle, RefreshCw, Search, Send,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useGet } from "../hooks/useGet";
import { getEcho } from "../api/echoService";
import { API_ENDPOINTS } from "../utils/constants";
import {
  getInstagramConversations,
  getInstagramMessages,
  markInstagramRead,
  sendInstagramMessage,
} from "../api/instagramApi";
import { formatAvailableMessages, hasChatAccess } from "../utils/chatAccess";
import { localizeApiLabel } from "../utils/localization";

const ACCOUNTS_URL = API_ENDPOINTS.INSTAGRAM.CHAT_ACCOUNTS;
const PAGE_SIZE = 30;

const COPY = {
  en: {
    title: "Instagram Direct", search: "Search", searchConversations: "Search conversations",
    noAccounts: "No Instagram accounts found", noAccess: "An active subscription is needed for inbox access.",
    available: (count) => `${count} messages available`, subscribe: "Choose a plan",
    emptyList: "No conversations yet", emptyChat: "Your messages will appear here",
    selectChat: "Select a conversation", messagePlaceholder: "Message...", online: "Instagram Direct",
    today: "Today", now: "now", me: "You", refresh: "Refresh inbox", loadMore: "Load more",
    older: "Older messages", conversationsError: "Could not load conversations.",
    messagesError: "Could not load messages.", sendError: "Message could not be sent.",
    messageSent: "Message sent", inbox: "Messages", account: "Instagram account",
    active: "Active", pending: "Pending", noImage: "Image", plans: "Plans",
  },
  ar: {
    title: "رسائل Instagram", search: "بحث", searchConversations: "ابحث في المحادثات",
    noAccounts: "لا توجد حسابات Instagram", noAccess: "يلزم اشتراك نشط لفتح صندوق الوارد.",
    available: (count) => `الرسائل المتاحة: ${count}`, subscribe: "اختيار باقة",
    emptyList: "لا توجد محادثات بعد", emptyChat: "ستظهر رسائلك هنا",
    selectChat: "اختر محادثة", messagePlaceholder: "رسالة...", online: "رسائل Instagram",
    today: "اليوم", now: "الآن", me: "أنت", refresh: "تحديث الرسائل", loadMore: "تحميل المزيد",
    older: "رسائل أقدم", conversationsError: "تعذر تحميل المحادثات.",
    messagesError: "تعذر تحميل الرسائل.", sendError: "تعذر إرسال الرسالة.",
    messageSent: "تم إرسال الرسالة", inbox: "الرسائل", account: "حساب Instagram",
    active: "نشط", pending: "قيد المراجعة", noImage: "صورة", plans: "الباقات",
  },
};

function InstagramAvatar({ account, conversation, size = 42 }) {
  const image = conversation?.profile_picture_url || account?.profile_picture_url;
  const label = conversation?.name || conversation?.username || account?.username || account?.name || "I";
  return image ? (
    <img src={image} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {String(label).slice(0, 1).toUpperCase()}
    </span>
  );
}

function messageTime(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function listTime(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

const uniqueOlder = (older, current) => {
  const ids = new Set(current.map((message) => message.id));
  return [...older.filter((message) => !ids.has(message.id)), ...current];
};

export default function InstagramChatPage({ embedded = false }) {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const locale = isRTL ? "ar-EG" : "en-GB";
  const t = COPY[lang] ?? COPY.en;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
const { data: accountsData, loading: accountsLoading } = useGet(ACCOUNTS_URL, { per_page: 100, paginate: 0 });
  const accounts = useMemo(() => {
    const list = accountsData?.data ?? [];
    return embedded ? list.filter((item) => item.subscription_status === true) : list;
  }, [accountsData, embedded]);
  const requestedAccountId = searchParams.get("accountId");
  const requestedInstagramId = searchParams.get("instagramId");
  const accountId = requestedAccountId || requestedInstagramId || "";

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsLoadingMore, setConversationsLoadingMore] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const messageListRef = useRef(null);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const olderHeightRef = useRef(null);
  const conversationRequestRef = useRef(0);
  const messageRequestRef = useRef(0);
  const defaultAccount = embedded ? null : accounts.find(hasChatAccess) || accounts[0] || null;
  const account = accounts.find((item) => String(item.id) === String(accountId))
    ?? accounts.find((item) => String(item.instagram_id) === String(accountId))
    ?? (!accountId ? defaultAccount : null);
  const canChat = hasChatAccess(account);

  const loadConversations = useCallback(async (page = 1) => {
    if (!account || !canChat) return;
    const requestId = ++conversationRequestRef.current;
    await Promise.resolve();
    if (requestId !== conversationRequestRef.current) return;
    if (page === 1) setConversationsLoading(true);
    else setConversationsLoadingMore(true);
    try {
      const response = await getInstagramConversations({ instagram_item_id: account.id, page, per_page: PAGE_SIZE, paginate: 0 });
      if (requestId !== conversationRequestRef.current) return;
      const list = response.data?.data ?? [];
      setConversations((current) => page === 1 ? list : [...current, ...list.filter((item) => !current.some((entry) => entry.sender_id === item.sender_id))]);
      setConversationPage(page);
      setHasMoreConversations(response.data?.pagination?.has_more ?? list.length >= PAGE_SIZE);
    } catch (error) {
      if (requestId === conversationRequestRef.current) toast.error(error.response?.data?.message || t.conversationsError);
    } finally {
      if (requestId === conversationRequestRef.current) {
        setConversationsLoading(false);
        setConversationsLoadingMore(false);
      }
    }
  }, [account, canChat, t]);

  const requestConversations = useEffectEvent(() => {
    if (account && canChat) loadConversations(1);
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) requestConversations();
    });
    return () => { cancelled = true; };
  }, [account, canChat]);

  const loadMessages = useCallback(async (page = 1) => {
    if (!account || !canChat || !selectedConversation) return;
    const requestId = ++messageRequestRef.current;
    await Promise.resolve();
    if (requestId !== messageRequestRef.current) return;
    if (page === 1) setMessagesLoading(true);
    else setMessagesLoadingMore(true);
    try {
      const response = await getInstagramMessages({
        instagram_item_id: account.id,
        sender_id: selectedConversation.sender_id,
        page,
        per_page: PAGE_SIZE,
        paginate: 0,
      });
      if (requestId !== messageRequestRef.current) return;
      const raw = response.data?.data ?? [];
      const chronological = [...raw].reverse();
      if (page === 1) setMessages(chronological);
      else {
        olderHeightRef.current = messageListRef.current?.scrollHeight ?? null;
        setMessages((current) => uniqueOlder(chronological, current));
      }
      setMessagePage(page);
      setHasOlderMessages(response.data?.pagination?.has_more ?? raw.length >= PAGE_SIZE);
    } catch (error) {
      if (requestId === messageRequestRef.current) toast.error(error.response?.data?.message || t.messagesError);
    } finally {
      if (requestId === messageRequestRef.current) {
        setMessagesLoading(false);
        setMessagesLoadingMore(false);
      }
    }
  }, [account, canChat, selectedConversation, t]);

  const requestMessages = useEffectEvent(() => {
    if (selectedConversation) loadMessages(1);
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) requestMessages();
    });
    return () => { cancelled = true; };
  }, [selectedConversation]);

  useLayoutEffect(() => {
    if (olderHeightRef.current !== null && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight - olderHeightRef.current;
      olderHeightRef.current = null;
      return;
    }
    messageEndRef.current?.scrollIntoView({ behavior: messagesLoading ? "auto" : "smooth" });
  }, [messages, messagesLoading]);

  const markConversationRead = useCallback((conversation) => {
    if (!account || !conversation) return;
    markInstagramRead({ instagram_item_id: account.id, sender_id: conversation.sender_id })
      .catch((error) => console.error("Could not mark Instagram conversation as read", error));
  }, [account]);

  useEffect(() => {
    if (!account || !canChat || !selectedConversation) return undefined;

    const echo = getEcho();
    const instagramId = account.instagram_id || account.id;
    const channelName = `userInsta_${selectedConversation.sender_id}_${instagramId}`;
    const channel = echo.channel(channelName);

    channel.listen(".MessageSent", (event) => {
      const payload = event.message && typeof event.message === "object" ? event.message : event;
      const isAdmin = Boolean(payload.is_admin) || payload.sender_type === "admin";
      const incoming = {
        ...payload,
        id: payload.id ?? payload.message_id ?? `realtime-${Date.now()}`,
        message: payload.message ?? payload.text ?? "",
        is_admin: isAdmin,
        sender_type: payload.sender_type || (isAdmin ? "admin" : "user"),
        is_image: payload.is_image || false,
        created_at: payload.created_at || new Date().toISOString(),
      };

      setMessages((current) => {
        if (current.some((message) => String(message.id) === String(incoming.id))) return current;
        if (isAdmin) {
          const optimisticIndex = current.findIndex((message) => message._optimistic && message.message === incoming.message);
          if (optimisticIndex !== -1) {
            const next = [...current];
            next[optimisticIndex] = incoming;
            return next;
          }
        }
        return [...current, incoming];
      });

      setConversations((current) => {
        const existing = current.find((conversation) => String(conversation.sender_id) === String(selectedConversation.sender_id));
        if (!existing) return current;
        const updated = {
          ...existing,
          last_message: incoming.is_image ? "📷 صورة" : incoming.message,
          last_message_at: incoming.created_at,
          last_sender_type: incoming.sender_type,
          unread_count: 0,
        };
        return [updated, ...current.filter((conversation) => String(conversation.sender_id) !== String(selectedConversation.sender_id))];
      });

      if (!isAdmin) markConversationRead(selectedConversation);
    });

    return () => echo.leave(channelName);
  }, [account, canChat, selectedConversation, markConversationRead]);

  const selectAccount = (nextAccountId) => {
    conversationRequestRef.current += 1;
    messageRequestRef.current += 1;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("accountId", nextAccountId);
    nextParams.delete("instagramId");
    setSearchParams(nextParams);
    setSelectedConversation(null);
    setConversations([]);
    setMessages([]);
    setConversationPage(1);
    setHasMoreConversations(false);
    setHasOlderMessages(false);
    setConversationsLoading(false);
    setConversationsLoadingMore(false);
    setMessagesLoading(false);
    setMessagesLoadingMore(false);
  };

  const selectConversation = (conversation) => {
    messageRequestRef.current += 1;
    setSelectedConversation(conversation);
    setMessages([]);
    setHasOlderMessages(false);
    setMessagePage(1);
    if (conversation.unread_count > 0) {
      markConversationRead(conversation);
      setConversations((current) => current.map((item) => item.sender_id === conversation.sender_id ? { ...item, unread_count: 0 } : item));
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !account || !canChat || !selectedConversation || sending) return;
    const optimistic = {
      id: `local-${Date.now()}`,
      message: text,
      is_admin: true,
      sender_type: "admin",
      is_image: false,
      is_read: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((current) => [...current, optimistic]);
    setMessageText("");
    setSending(true);
    try {
      const response = await sendInstagramMessage({
        instagram_item_id: account.id,
        recipient_id: selectedConversation.sender_id,
        message: text,
      });
      const sent = response.data?.data;
      if (sent && !Array.isArray(sent) && sent.id) {
        setMessages((current) => current.map((item) => item.id === optimistic.id ? sent : item));
      }
      setConversations((current) => [
        { ...selectedConversation, last_message: text, last_message_at: optimistic.created_at, last_sender_type: "admin", unread_count: 0 },
        ...current.filter((item) => item.sender_id !== selectedConversation.sender_id),
      ]);
      inputRef.current?.focus();
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setMessageText(text);
      toast.error(error.response?.data?.message || t.sendError);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conversation) =>
    [conversation.name, conversation.sender_id, conversation.last_message]
      .some((value) => String(value ?? "").toLowerCase().includes(conversationSearch.trim().toLowerCase()))
  );
  const activeLabel = account?.username ? `@${account.username}` : account?.name || t.title;

  return (
    <main className={`flex ${embedded ? "h-full" : "h-[100dvh]"} min-h-[520px] flex-col overflow-hidden bg-white text-[#262626]`} dir={isRTL ? "rtl" : "ltr"}>
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#dbdbdb] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{t.title}</h1>
            <p className="truncate text-xs text-[#737373]">{activeLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => navigate("/instagram-subscription")} title={t.plans} aria-label={t.plans}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#262626] transition-colors hover:bg-[#f5f5f5]">
            <CreditCard className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor="instagram-account">{t.account}</label>
          <select id="instagram-account" value={account?.id ?? ""} onChange={(event) => selectAccount(event.target.value)} disabled={accountsLoading || !accounts.length}
            className="max-w-[170px] rounded-lg border border-[#dbdbdb] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#a8a8a8] sm:max-w-[240px] sm:text-sm">
            {!accounts.length && <option value="">{t.account}</option>}
            {accounts.map((item) => <option key={item.id} value={item.id}>@{item.username || item.name || item.instagram_id} · {localizeApiLabel(item.subscription_status, lang, t.active)}</option>)}
          </select>
          <button type="button" onClick={() => loadConversations(1)} disabled={!canChat || conversationsLoading} title={t.refresh} aria-label={t.refresh}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#262626] transition-colors hover:bg-[#f5f5f5] disabled:opacity-40">
            <RefreshCw className={`h-[18px] w-[18px] ${conversationsLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 overflow-hidden border-x border-[#dbdbdb]">
        <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-e border-[#dbdbdb] ${embedded ? "md:w-[44%] lg:w-[44%]" : "md:w-[350px] lg:w-[398px]"}`}>
          <div className="flex h-[66px] shrink-0 items-center justify-between px-5">
            <h2 className="text-base font-semibold">{t.inbox}</h2>
            <button type="button" title={t.refresh} aria-label={t.refresh} onClick={() => loadConversations(1)} disabled={!canChat}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#262626] hover:bg-[#f5f5f5] disabled:opacity-40">
              <RefreshCw className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
          <label className="mx-4 mb-3 flex h-9 items-center gap-2 rounded-lg bg-[#efefef] px-3 text-[#737373]">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">{t.searchConversations}</span>
            <input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder={t.searchConversations}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#262626] outline-none placeholder:text-[#737373]" />
          </label>

          {!accountsLoading && !accounts.length ? (
            <div className="m-5 rounded-xl border border-[#dbdbdb] px-4 py-6 text-center text-sm text-[#737373]">{t.noAccounts}</div>
          ) : account && !canChat ? (
            <div className="m-5 rounded-xl border border-[#dbdbdb] px-4 py-6 text-center">
              <p className="text-sm font-medium">{t.noAccess}</p>
              <p className="mt-2 text-xs text-[#737373]">{t.available(formatAvailableMessages(account.available_msgs))}</p>
              <button type="button" onClick={() => navigate("/instagram-subscription")}
                className="mt-4 rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1877f2]">{t.subscribe}</button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="flex justify-center py-10"><LoaderCircle className="h-6 w-6 animate-spin text-[#8e8e8e]" aria-label="Loading" /></div>
              ) : filteredConversations.length ? filteredConversations.map((conversation) => (
                <button type="button" key={conversation.sender_id} onClick={() => selectConversation(conversation)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[#fafafa] ${selectedConversation?.sender_id === conversation.sender_id ? "bg-[#efefef]" : ""}`}>
                  <InstagramAvatar account={account} conversation={conversation} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{conversation.name || conversation.sender_id}</span>
                      <time className="shrink-0 text-[11px] text-[#8e8e8e]">{listTime(conversation.last_message_at, locale)}</time>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className={`truncate text-xs ${conversation.unread_count ? "font-semibold text-[#262626]" : "text-[#8e8e8e]"}`}>
                        {conversation.last_sender_type === "admin" && <CheckCheck className="me-1 inline h-3.5 w-3.5 text-[#0095f6]" aria-hidden="true" />}
                        {conversation.last_message || " "}
                      </span>
                      {conversation.unread_count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0095f6] px-1 text-[10px] font-semibold text-white">{conversation.unread_count}</span>}
                    </span>
                  </span>
                </button>
              )) : !conversationsLoading ? (
                <div className="px-5 py-12 text-center text-sm text-[#8e8e8e]">{t.emptyList}</div>
              ) : null}
              {hasMoreConversations && (
                <button type="button" onClick={() => loadConversations(conversationPage + 1)} disabled={conversationsLoadingMore}
                  className="flex w-full items-center justify-center gap-2 border-t border-[#efefef] py-3 text-sm font-medium text-[#0095f6] disabled:opacity-60">
                  {conversationsLoadingMore && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{t.loadMore}
                </button>
              )}
            </div>
          )}
        </aside>

        <section className={`${selectedConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-white`}>
          {selectedConversation ? (
            <>
              <header className="flex h-[66px] shrink-0 items-center gap-3 border-b border-[#dbdbdb] px-3 sm:px-5">
                <button type="button" onClick={() => setSelectedConversation(null)} aria-label={t.inbox}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5] md:hidden">
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <InstagramAvatar account={account} conversation={selectedConversation} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selectedConversation.name || selectedConversation.sender_id}</p>
                  <p className="text-xs text-[#8e8e8e]">{t.online}</p>
                </div>
              </header>
              <div ref={messageListRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8">
                {hasOlderMessages && (
                  <button type="button" onClick={() => loadMessages(messagePage + 1)} disabled={messagesLoadingMore}
                    className="mx-auto mb-4 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-[#737373] hover:bg-[#fafafa] disabled:opacity-60">
                    {messagesLoadingMore && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{t.older}
                  </button>
                )}
                {messagesLoading && !messages.length ? (
                  <div className="flex flex-1 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#8e8e8e]" aria-label="Loading" /></div>
                ) : messages.length ? messages.map((message) => {
                  const outgoing = Boolean(message.is_admin) || message.sender_type === "admin";
                  return (
                    <div key={message.id} className={`mb-2 flex ${outgoing ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-[22px] px-4 py-2.5 sm:max-w-[70%] ${outgoing ? "bg-gradient-to-r from-[#3797f0] to-[#7d2ae8] text-white" : "border border-[#efefef] bg-[#efefef] text-[#262626]"}`}>
                        {message.is_image && /^https?:\/\//i.test(message.message || "") ? (
                          <img src={message.message} alt={t.noImage} className="mb-1 max-h-72 rounded-xl object-cover" />
                        ) : <p className="whitespace-pre-wrap break-words text-sm">{message.message}</p>}
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${outgoing ? "text-white/75" : "text-[#8e8e8e]"}`}>
                          <time>{messageTime(message.created_at, locale)}</time>
                          {outgoing && (message.is_read ? <CheckCheck className="h-3.5 w-3.5" aria-label="Read" /> : <Check className="h-3.5 w-3.5" aria-label="Sent" />)}
                        </div>
                      </div>
                    </div>
                  );
                }) : !messagesLoading ? <p className="m-auto text-sm text-[#8e8e8e]">{t.emptyChat}</p> : null}
                <div ref={messageEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex shrink-0 items-end gap-2 border-t border-[#dbdbdb] p-3 sm:px-5 sm:py-4">
                <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-[#dbdbdb] px-4">
                  <input ref={inputRef} value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t.messagePlaceholder}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" disabled={!canChat || sending} />
                </div>
                <button type="submit" disabled={!messageText.trim() || sending || !canChat} aria-label={t.messagePlaceholder}
                  className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0095f6] transition-colors hover:bg-[#f5f5f5] disabled:opacity-40">
                  {sending ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-[#262626]"><MessageCircle className="h-11 w-11" strokeWidth={1.3} aria-hidden="true" /></span>
              <h2 className="mt-5 text-xl font-light">{t.selectChat}</h2>
              <p className="mt-2 text-sm text-[#8e8e8e]">{t.emptyChat}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
