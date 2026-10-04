import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search, Send, ImageIcon, Smile,
  ChevronLeft, Info, CheckCheck, Check,
  Loader2, RefreshCw, MessageCircle,
} from "lucide-react";

function FacebookIcon({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
import {
  getMessengerPages,
  getMessengerConversations,
  getMessengerMessages,
  sendMessengerMessage,
  markMessengerRead,
} from "../api/messengerApi";
import { getEcho } from "../api/echoService";
import { publishActiveChat, publishChatRead } from "../utils/chatUnreadEvents";
import { formatAvailableMessages, hasChatAccess } from "../utils/chatAccess";
import { localizeApiLabel } from "../utils/localization";

const CHAT_TEXT = {
  en: {
    now: "now", minutes: (count) => `${count}m`, search: "Search conversations...",
    noSubscription: "No subscription", subscriptionRequired: "An active subscription is required to view chats.",
    availableMessages: (count) => `Available messages: ${count}`, subscribe: "Subscribe to open chats",
    noConversations: "No conversations", chooseConversation: "Choose a conversation to get started",
    choosePage: "Choose a page first", page: (name) => `Page: ${name}`, you: "You: ", online: "Online",
    messagePlaceholder: "Write a message...", refresh: "Refresh conversations",
  },
  ar: {
    now: "الآن", minutes: (count) => `${count} د`, search: "ابحث في المحادثات...",
    noSubscription: "بدون اشتراك", subscriptionRequired: "المحادثات متاحة مع اشتراك نشط فقط.",
    availableMessages: (count) => `الرسائل المتاحة: ${count}`, subscribe: "اشترك لفتح المحادثات",
    noConversations: "لا توجد محادثات", chooseConversation: "اختر محادثة للبدء",
    choosePage: "اختر صفحة أولاً", page: (name) => `صفحة: ${name}`, you: "أنت: ", online: "متصل الآن",
    messagePlaceholder: "اكتب رسالة...", refresh: "تحديث المحادثات",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (iso, t, locale) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t.now;
  if (diff < 3600) return t.minutes(Math.floor(diff / 60));
  if (diff < 86400) return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
};

const msgTime = (iso, locale) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 40, online = false }) {
  const colors = [
    "#0084ff", "#44bec7", "#fa3c4c", "#d696bb",
    "#ff7e29", "#20cef5", "#67c93c", "#8e53c5",
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  const initials = name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}cc, ${color})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.38,
        fontFamily: "inherit",
      }}>
        {initials || "?"}
      </div>
      {online && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: "50%", background: "#31a24c",
          border: "2px solid #fff",
        }} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessengerChatPage({ embedded = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const locale = isRTL ? "ar-EG" : "en-GB";
  const t = CHAT_TEXT[lang] ?? CHAT_TEXT.en;
  const requestedPageId = searchParams.get("pageId");
  // Pages
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pagesLoading, setPagesLoading] = useState(true);

  // Conversations
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convSearch, setConvSearch] = useState("");

  // Messages
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const echoChannelRef = useRef(null);

  useEffect(() => {
    publishActiveChat(selectedConv ? {
      channel: "messenger",
      accountId: selectedPage?.page_id,
      senderId: selectedConv.sender_id,
    } : null);
    return () => publishActiveChat(null);
  }, [selectedPage?.page_id, selectedConv?.sender_id]);

  // ── Load Pages ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setPagesLoading(true);
    getMessengerPages()
      .then((r) => {
        const responsePages = r.data?.data || [];
        const list = embedded
          ? responsePages.filter((page) => page.subscription_status === true)
          : responsePages;
        setPages(list);
          const requestedPage = list.find((page) => String(page.page_id) === requestedPageId);
          const activePage = list.find(hasChatAccess) || list[0];
          const nextPage = requestedPage || activePage;
          if (nextPage) setSelectedPage(nextPage);
      })
      .catch(console.error)
      .finally(() => setPagesLoading(false));
        }, [embedded, requestedPageId]);

  // ── Load Conversations ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedPage) return;
    if (!hasChatAccess(selectedPage)) return;
    setConvsLoading(true);
    getMessengerConversations({ page_id: selectedPage.page_id })
      .then((r) => setConversations(r.data?.data || []))
      .catch(console.error)
      .finally(() => setConvsLoading(false));
  }, [selectedPage]);

  // ── Load Messages ────────────────────────────────────────────────────────────
  const loadMessages = useCallback((page, conv) => {
    if (!page || !hasChatAccess(page) || !conv) return;
    setMsgsLoading(true);
    getMessengerMessages({ page_id: page.page_id, sender_id: conv.sender_id })
      .then((r) => setMessages((r.data?.data || []).reverse()))
      .catch(console.error)
      .finally(() => setMsgsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedConv && selectedPage) loadMessages(selectedPage, selectedConv);
  }, [selectedConv, selectedPage, loadMessages]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Real-time: Laravel Echo / Reverb ────────────────────────────────────────
  useEffect(() => {
    if (!selectedPage || !hasChatAccess(selectedPage) || !selectedConv) return;

    const echo = getEcho();
    const channelName = `userChat_${selectedConv.sender_id}_${selectedPage.page_id}`;

    // Leave previous channel
    if (echoChannelRef.current) {
      echo.leave(echoChannelRef.current);
    }
    echoChannelRef.current = channelName;

    echo.channel(channelName).listen(".UserChatEvent", (e) => {
      // Map the incoming data since it might lack some fields like 'id', 'is_admin'
      const newMsg = {
        id: e.id || Date.now(), 
        message: e.message,
        is_admin: e.is_admin !== undefined ? e.is_admin : true, // Assuming auto-reply/agent if not provided
        sender_type: e.sender_type || "bot",
        is_image: e.is_image || false,
        created_at: e.created_at || new Date().toISOString(),
      };
      
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c.sender_id === selectedConv.sender_id
            ? { ...c, last_message: newMsg.message, last_message_at: newMsg.created_at, unread_count: 0 }
            : c
        )
      );
    });

    return () => {
      echo.leave(channelName);
      echoChannelRef.current = null;
    };
  }, [selectedPage, selectedConv]);

  // ── Send Message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedPage || !hasChatAccess(selectedPage) || !selectedConv || sending) return;
    setSending(true);
    const optimistic = {
      id: `opt_${Date.now()}`,
      message: text,
      is_admin: true,
      sender_type: "admin",
      is_image: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText("");
    try {
      await sendMessengerMessage({
        page_id: selectedPage.page_id,
        recipient_id: selectedConv.sender_id,
        message: text,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.sender_id === selectedConv.sender_id
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error(err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.name?.toLowerCase().includes(convSearch.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(convSearch.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...styles.root, height: embedded ? "100%" : "100vh", minWidth: 0, direction: isRTL ? "rtl" : "ltr" }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={styles.sidebar}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.fbIcon}>
              <FacebookIcon size={20} color="#fff" />
            </div>
            <span style={styles.sidebarTitle}>Messenger</span>
          </div>
          <button style={styles.iconBtn} title={t.refresh} aria-label={t.refresh}><RefreshCw size={18} /></button>
        </div>

        {/* Page Selector - always show */}
        {pages.length > 0 && (
          <div style={styles.pageSelector}>
            <select
              style={styles.pageSelect}
              value={selectedPage?.page_id || ""}
              onChange={(e) => {
                const p = pages.find((pg) => pg.page_id === e.target.value);
                setSelectedConv(null);
                setMessages([]);
                setConversations([]);
                setConvsLoading(false);
                setSelectedPage(p);
              }}
            >
              {embedded && !selectedPage && <option value="">{t.choosePage}</option>}
              {pages.map((p) => (
                  <option key={p.page_id} value={p.page_id}>
                    {hasChatAccess(p) ? "✅" : "🔒"} {p.page_name} · {localizeApiLabel(p.subscription_status, lang, t.noSubscription)} · {formatAvailableMessages(p.available_msgs)}
                  </option>
              ))}
            </select>
              {selectedPage && !hasChatAccess(selectedPage) && (
                <div style={{ color: "#fa3c3c", fontSize: 11, marginTop: 6, paddingRight: 4 }}>
                  <p>⚠️ {t.subscriptionRequired} {t.availableMessages(formatAvailableMessages(selectedPage.available_msgs))}</p>
                  <button type="button" onClick={() => navigate(`/order?pageId=${encodeURIComponent(selectedPage.page_id)}`)} style={{ marginTop: 6, color: "#7db7ff", fontWeight: 700 }}>
                    {t.subscribe}
                  </button>
                </div>
              )}
          </div>
        )}

        {/* Search */}
        <div style={styles.searchWrap}>
          <Search size={15} color="#8a8d91" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder={t.search}
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
          />
        </div>

        {/* Conversation List */}
        <div style={styles.convList}>
          {pagesLoading || convsLoading ? (
            <div style={styles.centered}><Loader2 size={28} className="spin" color="#0084ff" style={{ animation: "spin 1s linear infinite" }} /></div>
          ) : selectedPage && !hasChatAccess(selectedPage) ? (
            <div style={styles.emptyConvs}>
              <MessageCircle size={40} color="#b0b3b8" />
              <p style={{ color: "#e4e6eb", marginTop: 10, fontSize: 13 }}>{t.subscriptionRequired}</p>
              <p style={{ color: "#b0b3b8", marginTop: 5, fontSize: 12 }}>{t.availableMessages(formatAvailableMessages(selectedPage.available_msgs))}</p>
              <button type="button" onClick={() => navigate(`/order?pageId=${encodeURIComponent(selectedPage.page_id)}`)} style={{ marginTop: 12, color: "#7db7ff", fontSize: 13, fontWeight: 700 }}>
                {t.subscribe}
              </button>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={styles.emptyConvs}>
              <MessageCircle size={40} color="#b0b3b8" />
              <p style={{ color: "#b0b3b8", marginTop: 8, fontSize: 13 }}>{t.noConversations}</p>
            </div>
          ) : filteredConvs.map((conv) => (
            <motion.div
              key={conv.sender_id}
              whileHover={{ backgroundColor: "#3a3b3c" }}
              onClick={() => {
                setSelectedConv(conv);
                if (conv.unread_count > 0) {
                  markMessengerRead({ page_id: selectedPage.page_id, sender_id: conv.sender_id , channel : 'messenger' })
                    .then(publishChatRead)
                    .catch(console.error);
                  setConversations((prev) =>
                    prev.map((c) => (c.sender_id === conv.sender_id ? { ...c, unread_count: 0 } : c))
                  );
                }
              }}
              style={{
                ...styles.convItem,
                background: selectedConv?.sender_id === conv.sender_id ? "#3a3b3c" : "transparent",
              }}
            >
              <Avatar name={conv.name || "?"} size={48} online={Math.random() > 0.5} />
              <div style={styles.convInfo}>
                <div style={styles.convTopRow}>
                  <span style={{ ...styles.convName, fontWeight: conv.unread_count > 0 ? 700 : 500 }}>
                    {conv.name || conv.sender_id}
                  </span>
                  <span style={styles.convTime}>{fmt(conv.last_message_at, t, locale)}</span>
                </div>
                <div style={styles.convBottomRow}>
                  <span style={{
                    ...styles.convLastMsg,
                    fontWeight: conv.unread_count > 0 ? 600 : 400,
                    color: conv.unread_count > 0 ? "#e4e6eb" : "#b0b3b8",
                  }}>
                    {conv.last_sender_type === "admin" && <span style={{ color: "#0084ff" }}>{t.you}</span>}
                    {conv.last_message?.slice(0, 35)}{conv.last_message?.length > 35 ? "..." : ""}
                  </span>
                  {conv.unread_count > 0 && (
                    <span style={styles.badge}>{conv.unread_count}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </aside>

      {/* ── Chat Area ───────────────────────────────────────── */}
      <main style={styles.chatArea}>
        {!selectedConv ? (
          <div style={styles.noChatSelected}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: "center" }}
            >
              <div style={styles.bigFbIcon}><FacebookIcon size={48} color="#fff" /></div>
              <h2 style={{ color: "#e4e6eb", marginTop: 20, fontSize: 22, fontWeight: 700 }}>
                {selectedPage && !hasChatAccess(selectedPage) ? t.subscriptionRequired : t.chooseConversation}
              </h2>
              <p style={{ color: "#b0b3b8", marginTop: 8, fontSize: 14 }}>
                {selectedPage && !hasChatAccess(selectedPage)
                  ? t.availableMessages(formatAvailableMessages(selectedPage.available_msgs))
                  : selectedPage ? t.page(selectedPage.page_name) : t.choosePage}
              </p>
              {selectedPage && !hasChatAccess(selectedPage) && (
                <button type="button" onClick={() => navigate(`/order?pageId=${encodeURIComponent(selectedPage.page_id)}`)} style={{ marginTop: 12, color: "#7db7ff", fontWeight: 700 }}>
                  {t.subscribe}
                </button>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <button style={styles.iconBtn} onClick={() => setSelectedConv(null)}>
                <ChevronLeft size={22} />
              </button>
              <Avatar name={selectedConv.name || "?"} size={40} online />
              <div style={{ flex: 1, marginInlineStart: 10 }}>
                <div style={{ color: "#e4e6eb", fontWeight: 700, fontSize: 15 }}>
                  {selectedConv.name || selectedConv.sender_id}
                </div>
                <div style={{ color: "#31a24c", fontSize: 12 }}>{t.online}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={styles.headerBtn}><Info size={18} /></button>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              {msgsLoading ? (
                <div style={styles.centered}>
                  <Loader2 size={30} color="#0084ff" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      const isAdmin = msg.is_admin || msg.sender_type === "admin";
                      const showAvatar = !isAdmin && (i === 0 || messages[i - 1]?.is_admin || messages[i - 1]?.sender_type === "admin");
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            display: "flex",
                            flexDirection: isAdmin ? "row-reverse" : "row",
                            alignItems: "flex-end",
                            gap: 8,
                            marginBottom: 4,
                            padding: "0 16px",
                          }}
                        >
                          {/* Avatar for customer */}
                          {!isAdmin && (
                            <div style={{ width: 28, flexShrink: 0 }}>
                              {showAvatar && <Avatar name={selectedConv.name || "?"} size={28} />}
                            </div>
                          )}

                          {/* Bubble */}
                          <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                            {msg.is_image ? (
                              <div style={{
                                ...styles.bubble,
                                background: isAdmin ? "linear-gradient(135deg,#0084ff,#0066cc)" : "#3a3b3c",
                                padding: 4, borderRadius: 18,
                              }}>
                                <img src={msg.message} alt="img" style={{ maxWidth: 220, borderRadius: 14, display: "block" }} />
                              </div>
                            ) : (
                              <div style={{
                                ...styles.bubble,
                                background: isAdmin ? "linear-gradient(135deg,#0084ff,#0066cc)" : "#3a3b3c",
                                color: isAdmin ? "#fff" : "#e4e6eb",
                                borderBottomRightRadius: isAdmin ? 4 : 18,
                                borderBottomLeftRadius: isAdmin ? 18 : 4,
                              }}>
                                {msg.message}
                              </div>
                            )}
                            <div style={styles.msgMeta}>
                              <span style={{ color: "#b0b3b8", fontSize: 11 }}>{msgTime(msg.created_at, locale)}</span>
                              {isAdmin && (
                                msg.is_read
                                  ? <CheckCheck size={14} color="#0084ff" />
                                  : <Check size={14} color="#b0b3b8" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div style={styles.inputBar}>
              <button style={styles.inputIconBtn}><ImageIcon size={20} color="#0084ff" /></button>
              <button style={styles.inputIconBtn}><Smile size={20} color="#0084ff" /></button>
              <div style={styles.inputWrap}>
                <input
                  ref={inputRef}
                  style={styles.msgInput}
                  placeholder={t.messagePlaceholder}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                style={styles.sendBtn}
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
              >
                {sending
                  ? <Loader2 size={18} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={18} color="#fff" style={{ transform: "rotate(180deg)" }} />
                }
              </motion.button>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #4e4f50; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#18191a",
    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    direction: "rtl",
    overflow: "hidden",
  },
  sidebar: {
    width: "min(44%, 360px)",
    minWidth: 0,
    background: "#242526",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #3a3b3c",
    flexShrink: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 16px 10px",
  },
  fbIcon: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg,#0084ff,#0057e7)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  bigFbIcon: {
    width: 90, height: 90, borderRadius: "50%",
    background: "linear-gradient(135deg,#0084ff,#0057e7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto",
  },
  sidebarTitle: {
    color: "#e4e6eb",
    fontSize: 22,
    fontWeight: 800,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#b0b3b8",
    cursor: "pointer",
    padding: 6,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  pageSelector: {
    padding: "0 16px 8px",
  },
  pageSelect: {
    width: "100%",
    background: "#3a3b3c",
    border: "none",
    borderRadius: 10,
    color: "#e4e6eb",
    padding: "8px 12px",
    fontSize: 13,
    cursor: "pointer",
    outline: "none",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#3a3b3c",
    borderRadius: 20,
    margin: "0 12px 10px",
    padding: "8px 14px",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e4e6eb",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  convList: {
    flex: 1,
    overflowY: "auto",
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    gap: 10,
    cursor: "pointer",
    borderRadius: 10,
    margin: "2px 8px",
    transition: "background 0.15s",
  },
  convInfo: {
    flex: 1,
    overflow: "hidden",
  },
  convTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convName: {
    color: "#e4e6eb",
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 180,
  },
  convTime: {
    color: "#b0b3b8",
    fontSize: 11,
    flexShrink: 0,
  },
  convBottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  convLastMsg: {
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 190,
  },
  badge: {
    background: "#0084ff",
    color: "#fff",
    borderRadius: 10,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: 40,
  },
  emptyConvs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 40,
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#18191a",
    overflow: "hidden",
  },
  noChatSelected: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    background: "#242526",
    borderBottom: "1px solid #3a3b3c",
    gap: 8,
  },
  headerBtn: {
    background: "#3a3b3c",
    border: "none",
    color: "#0084ff",
    cursor: "pointer",
    width: 36, height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    paddingTop: 16,
    paddingBottom: 8,
    display: "flex",
    flexDirection: "column",
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: "100%",
    wordBreak: "break-word",
  },
  msgMeta: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    padding: "0 4px",
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    background: "#242526",
    borderTop: "1px solid #3a3b3c",
  },
  inputIconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 6,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    background: "#3a3b3c",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    padding: "2px 14px",
  },
  msgInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e4e6eb",
    fontSize: 14,
    padding: "8px 0",
    textAlign: "right",
  },
  sendBtn: {
    width: 38, height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#0084ff,#0066cc)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    opacity: 1,
    transition: "opacity 0.2s",
  },
};
