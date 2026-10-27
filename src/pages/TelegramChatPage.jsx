import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Loader2, MessageSquareText, Search, SendHorizontal } from "lucide-react";
import {
  getTelegramAccounts,
  getTelegramConversations,
  getTelegramMessages,
  sendTelegramReply,
  markTelegramRead,
} from "../api/telegramApi";

const COPY = {
  en: {
    title: "Telegram",
    noAccount: "No Telegram bot connected yet.",
    noConversations: "No conversations yet.",
    search: "Search conversations",
    write: "Write a message...",
    send: "Send",
    loading: "Loading Telegram chats...",
    notConnected: "Connect a Telegram bot from the Connect accounts page first.",
    customer: "Customer",
    you: "You",
    disconnect: "Clear",
  },
  ar: {
    title: "تيليجرام",
    noAccount: "لا يوجد بوت تيليجرام مرتبط بعد.",
    noConversations: "لا توجد محادثات بعد.",
    search: "ابحث في المحادثات",
    write: "اكتب رسالة...",
    send: "إرسال",
    loading: "جاري تحميل محادثات تيليجرام...",
    notConnected: "اربط بوت Telegram أولاً من صفحة ربط الحسابات.",
    customer: "العميل",
    you: "أنت",
    disconnect: "مسح",
  },
};

function TelegramAvatar({ name, size = 40 }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";

  return (
    <div
      className="flex items-center justify-center rounded-full bg-[#229ED9] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export default function TelegramChatPage({ embedded = false }) {
  const lang = useSelector((state) => state.ui.lang);
  const [searchParams] = useSearchParams();
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const requestedAccountId = searchParams.get("telegramAccountId");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationsError, setConversationsError] = useState("");
  const messagesEndRef = useRef(null);

  const setChronologicalMessages = (list) => {
    setMessages(Array.isArray(list) ? [...list].reverse() : []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getTelegramAccounts()
      .then((response) => {
        if (ignore) return;
        const list = response.data?.data ?? response.data ?? [];
        setAccounts(list);
        const fallbackAccount = list.find((account) => String(account.id) === requestedAccountId) || list[0] || null;
        setSelectedAccount(fallbackAccount);
      })
      .catch((error) => {
        console.error("Could not load Telegram accounts:", error);
        setAccounts([]);
        setSelectedAccount(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [requestedAccountId]);

  useEffect(() => {
    if (!selectedAccount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversations([]);
      setSelectedConversation(null);
      return;
    }

    const accountId = selectedAccount.id;
    setConversationsError("");
    getTelegramConversations({
      telegram_account_id: accountId,
      ...(search.trim() ? { search: search.trim() } : {}),
      page: 1,
    })
      .then((response) => {
        const list = response.data?.data ?? response.data ?? [];
        const first = list[0] ?? null;
        setConversations(list);
        setSelectedConversation((current) => current && list.some((item) => item.sender_id === current.sender_id) ? current : first);
      })
      .catch((error) => {
        console.error("Could not load Telegram conversations:", error);
        setConversationsError(error.response?.data?.message || error.message || "");
        setConversations([]);
        setSelectedConversation(null);
      });
  }, [selectedAccount, search]);

  useEffect(() => {
    if (!selectedAccount || !selectedConversation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }

    getTelegramMessages({
      telegram_account_id: selectedAccount.id,
      sender_id: selectedConversation.sender_id,
      page: 1,
    })
      .then((response) => {
        const list = response.data?.data ?? response.data ?? [];
        setChronologicalMessages(list);
        markTelegramRead({
          telegram_account_id: selectedAccount.id,
          sender_id: selectedConversation.sender_id,
        }).catch((error) => {
          console.error("Could not mark Telegram conversation as read:", error);
        });
      })
      .catch((error) => {
        console.error("Could not load Telegram messages:", error);
        setMessages([]);
      });
  }, [selectedAccount, selectedConversation]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const label = [conversation.name, conversation.sender_name, conversation.sender_id, conversation.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return label.includes(query);
    });
  }, [conversations, search]);

  const handleSend = async () => {
    if (!selectedAccount || !selectedConversation || !messageText.trim()) return;
    setSending(true);
    try {
      await sendTelegramReply({
        telegram_account_id: selectedAccount.id,
        recipient_id: selectedConversation.sender_id,
        message: messageText.trim(),
      });
      const nextText = messageText.trim();
      setMessageText("");
      const updated = await getTelegramMessages({
        telegram_account_id: selectedAccount.id,
        sender_id: selectedConversation.sender_id,
        page: 1,
      });
      setChronologicalMessages(updated.data?.data ?? updated.data ?? []);
      if (nextText) {
        const nextList = await getTelegramConversations({
          telegram_account_id: selectedAccount.id,
          ...(search.trim() ? { search: search.trim() } : {}),
          page: 1,
        });
        setConversations(nextList.data?.data ?? nextList.data ?? []);
      }
    } catch (error) {
      console.error("Could not send Telegram message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.loading}
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[var(--muted-foreground)]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-md space-y-2">
          <MessageSquareText className="mx-auto h-8 w-8 text-[#229ED9]" />
          <p className="font-medium text-[var(--foreground)]">{t.noAccount}</p>
          {!embedded && <p>{t.notConnected}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[580px] bg-[var(--background)]" dir={isRTL ? "rtl" : "ltr"}>
      <aside className="w-full max-w-[320px] border-e border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pe-3 ps-9 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted-foreground)]">
              {conversationsError || t.noConversations}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.sender_id === conversation.sender_id;
              return (
                <button
                  key={`${conversation.sender_id}-${conversation.telegram_account_id ?? selectedAccount?.id}`}
                  type="button"
                  onClick={() => setSelectedConversation(conversation)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition-colors ${
                    isSelected ? "border-[var(--primary)] bg-[var(--accent)]" : "border-transparent bg-[var(--background)] hover:border-[var(--border)]"
                  }`}
                >
                  <TelegramAvatar name={conversation.name || conversation.sender_name || conversation.sender_id} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {conversation.name || conversation.sender_name || conversation.sender_id || t.customer}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {conversation.last_message || ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
        {selectedAccount && selectedConversation ? (
          <>
            <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center gap-3">
                <TelegramAvatar name={selectedConversation.name || selectedConversation.sender_name || selectedConversation.sender_id} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {selectedConversation.name || selectedConversation.sender_name || selectedConversation.sender_id || t.customer}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">@{selectedAccount.bot_username || selectedAccount.bot_name || "bot"}</p>
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--background)] p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                  {t.noConversations}
                </div>
              ) : (
                messages.map((message, index) => {
                  const isMe = message.is_admin === true
                    || ["admin", "agent", "bot"].includes(String(message.sender_type).toLowerCase())
                    || message.direction === "outgoing";
                  return (
                    <div
                      key={`${message.id ?? message.message_id ?? index}-${index}`}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isMe ? "bg-[#229ED9] text-white" : "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.message || message.text || ""}</p>
                        <p className={`mt-1 text-[10px] ${isMe ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>
                          {isMe ? t.you : t.customer}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center gap-2">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={t.write}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !messageText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                  {t.send}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--muted-foreground)]">
            {t.noConversations}
          </div>
        )}
      </section>
    </div>
  );
}
