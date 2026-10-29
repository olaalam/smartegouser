import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Loader2,
  Search,
  SendHorizontal,
  Bot,
  User,
  ShieldCheck,
  CheckCheck,
  Check,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import {
  getTikTokChatAccounts,
  getTikTokConversations,
  getTikTokMessages,
  sendTikTokReply,
} from "../api/tiktokApi";
import { publishActiveChat, publishChatRead } from "../utils/chatUnreadEvents";

const TikTokIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V8.47a8.28 8.28 0 0 0 4.84 1.55V6.69h-.93z" />
  </svg>
);

const COPY = {
  en: {
    title: "TikTok Live Chat",
    noAccount: "No TikTok accounts connected yet.",
    noAccountDesc: "Go to Connect Accounts to link your TikTok Business account.",
    noConversations: "No conversations found.",
    noMessages: "No messages in this conversation.",
    searchPlaceholder: "Search by customer name or ID...",
    writePlaceholder: "Write a reply to the customer (up to 4000 characters)...",
    send: "Send",
    sending: "Sending...",
    customer: "Customer",
    botReply: "AI Bot Reply",
    agentReply: "Agent Reply",
    storeReply: "Store Reply",
    remaining: "Msgs remaining",
    selectConversation: "Select a conversation to start chatting",
    refresh: "Refresh",
    backToList: "Back to conversations",
    online: "Connected",
  },
  ar: {
    title: "محادثات تيك توك المباشرة",
    noAccount: "لا توجد حسابات تيك توك مرتبطة بعد.",
    noAccountDesc: "انتقل إلى صفحة ربط الحسابات لربط حساب TikTok Business.",
    noConversations: "لا توجد محادثات حتى الآن.",
    noMessages: "لا توجد رسائل في هذه المحادثة.",
    searchPlaceholder: "ابحث باسم العميل أو المعرف...",
    writePlaceholder: "اكتب رداً للعميل (بحد أقصى 4000 حرف)...",
    send: "إرسال",
    sending: "جاري الإرسال...",
    customer: "العميل",
    botReply: "رد ذكي تلقائي (AI)",
    agentReply: "رد الموظف",
    storeReply: "المتجر",
    remaining: "الرسائل المتبقية",
    selectConversation: "اختر محادثة من القائمة لعرض الرسائل والرد",
    refresh: "تحديث",
    backToList: "العودة للمحادثات",
    online: "متصل",
  },
};

function CustomerAvatar({ name = "?", size = 38 }) {
  const initials = (name || "?")
    .replace(/^cust_tiktok_/, "C ")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] font-bold text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "T"}
    </div>
  );
}

export default function TikTokChatPage({ embedded = false }) {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedAccountId = searchParams.get("tiktokAccountId");

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef(null);
  const selectedAccountRef = useRef(selectedAccount);
  const selectedConversationRef = useRef(selectedConversation);

  useEffect(() => {
    selectedAccountRef.current = selectedAccount;
  }, [selectedAccount]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat accounts
  useEffect(() => {
    let ignore = false;
    setLoadingAccounts(true);
    getTikTokChatAccounts({ per_page: 50, paginate: 0 })
      .then((res) => {
        if (ignore) return;
        const list = res.data?.data ?? res.data ?? [];
        const accountsList = Array.isArray(list) ? list : [];
        setAccounts(accountsList);

        if (accountsList.length > 0) {
          const matched =
            accountsList.find((acc) => String(acc.id) === String(requestedAccountId)) ||
            accountsList[0];
          setSelectedAccount(matched);
        } else {
          setSelectedAccount(null);
        }
      })
      .catch((err) => {
        console.error("Could not load TikTok chat accounts:", err);
        setAccounts([]);
        setSelectedAccount(null);
      })
      .finally(() => {
        if (!ignore) setLoadingAccounts(false);
      });

    return () => {
      ignore = true;
    };
  }, [requestedAccountId]);

  // Load conversations for selected account
  const loadConversations = useCallback(
    async (keepSelected = true) => {
      if (!selectedAccount) {
        setConversations([]);
        setSelectedConversation(null);
        return;
      }

      setLoadingConversations(true);
      try {
        const res = await getTikTokConversations({
          tiktok_account_id: selectedAccount.id,
          ...(search.trim() ? { search: search.trim() } : {}),
          page: 1,
          per_page: 50,
        });
        const list = res.data?.data ?? res.data ?? [];
        const convList = Array.isArray(list) ? list : [];
        setConversations(convList);

        if (keepSelected && selectedConversationRef.current) {
          const stillThere = convList.find(
            (c) => c.sender_id === selectedConversationRef.current?.sender_id
          );
          if (stillThere) {
            setSelectedConversation(stillThere);
          } else if (convList.length > 0) {
            setSelectedConversation(convList[0]);
          } else {
            setSelectedConversation(null);
          }
        } else if (convList.length > 0) {
          setSelectedConversation(convList[0]);
        } else {
          setSelectedConversation(null);
        }
      } catch (err) {
        console.error("Could not load TikTok conversations:", err);
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    },
    [search, selectedAccount]
  );

  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  // Load messages when conversation changes
  const loadMessages = useCallback(async () => {
    if (!selectedAccount || !selectedConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      publishActiveChat({
        channel: "tiktok",
        accountId: selectedAccount.id,
        senderId: selectedConversation.sender_id,
      });

      const res = await getTikTokMessages({
        tiktok_account_id: selectedAccount.id,
        sender_id: selectedConversation.sender_id,
        page: 1,
        per_page: 50,
      });

      // API auto marks messages as read
      publishChatRead();

      // Decrement unread counter locally for this conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.sender_id === selectedConversation.sender_id ? { ...c, unread_count: 0 } : c
        )
      );

      const list = res.data?.data ?? res.data ?? [];
      // If messages returned in newest-first order, reverse them to display chronologically
      const ordered = Array.isArray(list) ? [...list].reverse() : [];
      setMessages(ordered);
    } catch (err) {
      console.error("Could not load TikTok messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedAccount, selectedConversation]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Filter conversations locally if needed
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchSenderId = (c.sender_id || "").toLowerCase().includes(q);
      const matchLastMsg = (c.last_message || "").toLowerCase().includes(q);
      return matchName || matchSenderId || matchLastMsg;
    });
  }, [conversations, search]);

  // Send manual reply
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedAccount || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await sendTikTokReply({
        tiktok_account_id: selectedAccount.id,
        recipient_id: selectedConversation.sender_id,
        message: text,
      });

      setMessageText("");

      const newMsgData = res.data?.data ?? {
        id: Date.now(),
        message: text,
        sender_type: "agent",
        is_admin: true,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsgData]);

      // Update last message in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.sender_id === selectedConversation.sender_id
            ? {
                ...c,
                last_message: text,
                last_message_at: new Date().toISOString(),
                last_sender_type: "agent",
              }
            : c
        )
      );
    } catch (err) {
      console.error("Error sending TikTok reply:", err);
    } finally {
      setSending(false);
    }
  };

  const handleAccountChange = (acc) => {
    setSelectedAccount(acc);
    setSearchParams((cur) => {
      const next = new URLSearchParams(cur);
      next.set("tiktokAccountId", String(acc.id));
      return next;
    });
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loadingAccounts) {
    return (
      <div
        className="flex h-full min-h-[500px] items-center justify-center gap-3 bg-[var(--background)] text-sm text-[var(--muted-foreground)]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#FE2C55]" />
        {t.title}...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div
        className="flex h-full min-h-[500px] flex-col items-center justify-center bg-[var(--background)] p-8 text-center text-sm"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FE2C55]/10 text-[#FE2C55]">
          <TikTokIcon className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">{t.noAccount}</h3>
        <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">{t.noAccountDesc}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-[580px] bg-[var(--background)] ${
        embedded ? "" : "min-h-screen"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Sidebar: Conversations List */}
      <aside
        className={`flex w-full flex-col border-e border-[var(--border)] bg-[var(--card)] md:w-80 lg:w-96 ${
          showMobileList ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Account Selector & Quota */}
        <div className="border-b border-[var(--border)] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FE2C55] text-white">
                <TikTokIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--foreground)]">
                  {selectedAccount?.display_name || selectedAccount?.username || "TikTok"}
                </p>
                <p className="truncate text-[10px] text-[var(--muted-foreground)]">
                  @{selectedAccount?.username || selectedAccount?.open_id}
                </p>
              </div>
            </div>

            {/* Quota Badge */}
            <div className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]">
              <span className="text-[#FE2C55]">
                {selectedAccount?.available_msgs ?? selectedAccount?.msg_number ?? 0}
              </span>{" "}
              <span className="text-[10px] text-[var(--muted-foreground)]">{t.remaining}</span>
            </div>
          </div>

          {/* Multiple Accounts Dropdown if more than 1 */}
          {accounts.length > 1 && (
            <div className="mt-2.5">
              <select
                value={selectedAccount?.id}
                onChange={(e) => {
                  const acc = accounts.find((a) => String(a.id) === e.target.value);
                  if (acc) handleAccountChange(acc);
                }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium outline-none focus:border-[#FE2C55]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.username || acc.open_id} ({acc.display_name || "TikTok"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search & Refresh Bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-1.5 pe-3 ps-8 text-xs outline-none focus:border-[#FE2C55]"
            />
          </div>
          <button
            type="button"
            onClick={() => loadConversations(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            title={t.refresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingConversations ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Conversations List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loadingConversations ? (
            <div className="flex h-32 items-center justify-center text-xs text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin text-[#FE2C55]" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-4 text-center text-xs text-[var(--muted-foreground)]">
              <MessageCircle className="h-8 w-8 stroke-1 text-[var(--muted-foreground)]/50" />
              <p className="mt-2 font-medium">{t.noConversations}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.sender_id === conv.sender_id;
              const unread = conv.unread_count || 0;

              return (
                <button
                  key={conv.sender_id}
                  type="button"
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileList(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-start transition-colors ${
                    isSelected
                      ? "border-[#FE2C55]/60 bg-[#FE2C55]/10 dark:bg-[#FE2C55]/15"
                      : "border-transparent bg-[var(--background)] hover:border-[var(--border)]"
                  }`}
                >
                  <CustomerAvatar name={conv.name || conv.sender_id} size={40} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-[var(--foreground)]">
                        {conv.name || conv.sender_id}
                      </p>
                      {conv.last_message_at && (
                        <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                        {conv.last_message || "..."}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FE2C55] px-1 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Conversation Pane */}
      <section
        className={`flex min-w-0 flex-1 flex-col bg-[var(--background)] ${
          showMobileList ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Header: Customer Info & Status */}
            <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileList(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] md:hidden hover:text-[var(--foreground)]"
                  title={t.backToList}
                >
                  <BackIcon className="h-4 w-4" />
                </button>

                <CustomerAvatar name={selectedConversation.name || selectedConversation.sender_id} size={38} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-[var(--foreground)]">
                      {selectedConversation.name || selectedConversation.sender_id}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t.online}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                    ID: {selectedConversation.sender_id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadMessages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                title={t.refresh}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? "animate-spin" : ""}`} />
              </button>
            </header>

            {/* Messages Body */}
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FE2C55]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[var(--muted-foreground)]">
                  <MessageCircle className="h-10 w-10 text-[var(--muted-foreground)]/40" />
                  <p className="mt-2 font-medium">{t.noMessages}</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isStore =
                    msg.is_admin === true ||
                    ["bot", "agent", "admin"].includes(String(msg.sender_type).toLowerCase()) ||
                    msg.direction === "outgoing";

                  const isBot = String(msg.sender_type).toLowerCase() === "bot";
                  const isAgent = String(msg.sender_type).toLowerCase() === "agent";

                  return (
                    <div
                      key={msg.id ?? index}
                      className={`flex ${isStore ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`group relative max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm transition-shadow hover:shadow ${
                          isStore
                            ? isBot
                              ? "border border-[#FE2C55]/30 bg-[#FE2C55]/10 text-[var(--foreground)]"
                              : "bg-[#FE2C55] text-white"
                            : "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                        }`}
                      >
                        {/* Sender Label Badge */}
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] opacity-85">
                          {isBot ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#FE2C55]">
                              <Sparkles className="h-3 w-3" />
                              {t.botReply}
                            </span>
                          ) : isAgent ? (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <ShieldCheck className="h-3 w-3" />
                              {t.agentReply}
                            </span>
                          ) : isStore ? (
                            <span className="font-semibold">{t.storeReply}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-[var(--muted-foreground)]">
                              <User className="h-3 w-3" />
                              {selectedConversation.name || t.customer}
                            </span>
                          )}
                        </div>

                        {/* Message Content */}
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.message || msg.text || ""}
                        </p>

                        {/* Timestamp & Read Checkmark */}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                            isStore && !isBot ? "text-white/80" : "text-[var(--muted-foreground)]"
                          }`}
                        >
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                          {isStore && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck className="h-3 w-3 text-current" />
                              ) : (
                                <Check className="h-3 w-3 text-current" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Send Reply Footer */}
            <footer className="border-t border-[var(--border)] bg-[var(--card)] p-3">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4000}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t.writePlaceholder}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs outline-none transition-colors focus:border-[#FE2C55]"
                />

                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <SendHorizontal className="h-4 w-4" />
                      <span>{t.send}</span>
                    </>
                  )}
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-[var(--muted-foreground)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--card)] text-[var(--muted-foreground)]">
              <MessageCircle className="h-7 w-7" />
            </div>
            <p className="mt-3 font-semibold text-[var(--foreground)]">{t.selectConversation}</p>
          </div>
        )}
      </section>
    </div>
  );
}

