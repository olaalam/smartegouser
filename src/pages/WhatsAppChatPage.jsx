import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Smile, MoreVertical,
  ChevronLeft, Camera,
  CheckCheck, Check, Loader2, RefreshCw,
  MessageSquare, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useGet } from "../hooks/useGet";
import { usePost } from "../hooks/usePost";
import { getWhatsAppConversations, getWhatsAppMessages } from "../api/whatsappApi";
import { getEcho } from "../api/echoService";

// ─── Endpoints / paging ───────────────────────────────────────────────────────
const NUMBERS_URL = "user/chat/whatsapp/numbers";
const SEND_URL = "user/chat/whatsapp/send";
const MARK_READ_URL = "user/chat/mark-as-read";
const NUMBERS_PARAMS = { per_page: 100 };
const CONVS_PER_PAGE = 30;
const MSGS_PER_PAGE = 30;

const isAdminMsg = (m) => Boolean(m?.is_admin) || m?.sender_type === "admin";
// دمج بدون تكرار: العناصر الجديدة تتضاف في الآخر (للمحادثات)
const appendUnique = (current, more, key) => {
  const seen = new Set(current.map((x) => x[key]));
  return [...current, ...more.filter((x) => !seen.has(x[key]))];
};
// رسائل أقدم بتتحط في الأول
const prependUnique = (older, current) => {
  const ids = new Set(current.map((m) => m.id));
  return [...older.filter((m) => !ids.has(m.id)), ...current];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
};

const msgTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
};

// ─── WhatsApp Colors (Dark Theme) ─────────────────────────────────────────────
const WA = {
  bg: "#111b21",
  sidebar: "#111b21",
  chatBg: "#0b141a",
  header: "#202c33",
  border: "#222d34",
  searchBg: "#111b21",
  searchInput: "#202c33",
  text: "#e9edef",
  textMuted: "#8696a0",
  green: "#00a884",
  greenDark: "#008069",
  convHover: "#202c33",
  convSelected: "#2a3942",
  inBubble: "#202c33",
  outBubble: "#005c4b",
  inputArea: "#202c33",
};

// ─── Avatar Component ─────────────────────────────────────────────────────────
function WaAvatar({ name = "", size = 40 }) {
  const colors = ["#00a884", "#128c7e", "#25d366", "#075e54", "#34b7f1"];
  const color = colors[name.charCodeAt(0) % colors.length] || "#00a884";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── WhatsApp Logo ────────────────────────────────────────────────────────────
function WaLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25d366" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppChatPage() {
  // ── Numbers (useGet) ─────────────────────────────────────────────────────────
  const { data: numbersData, loading: numbersLoading } = useGet(NUMBERS_URL, NUMBERS_PARAMS);
  const numbers = useMemo(() => numbersData?.data ?? [], [numbersData]);
  const [selectedNumberId, setSelectedNumberId] = useState(null);
  const selectedNumber = numbers.find((n) => n.id === selectedNumberId) ?? null;

  // ── Conversations ────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [convsLoadingMore, setConvsLoadingMore] = useState(false);
  const [convPage, setConvPage] = useState(1);
  const [convHasMore, setConvHasMore] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convSearch, setConvSearch] = useState("");
  const selectedPhone = selectedConv?.phone ?? null;

  // ── Messages ─────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgsLoadingMore, setMsgsLoadingMore] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);
  const [messageText, setMessageText] = useState("");

  const { execute: sendPost, loading: sending } = usePost();
  const { execute: readPost } = usePost(); // instance منفصلة عشان loading الإرسال ما يتأثرش

  const listRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevHeightRef = useRef(null);   // بنحفظ الارتفاع قبل تحميل رسائل أقدم
  const convReqRef = useRef(0);         // بيتجاهل الردود القديمة (race conditions)
  const msgReqRef = useRef(0);

  // ── mark-as-read (usePost) ───────────────────────────────────────────────────
  const markRead = (numberId, phone) =>
    readPost(MARK_READ_URL, { channel: "whatsapp", whats_item_id: numberId, phone });
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead; // الـ listener بتاع Echo يستخدم آخر نسخة

  // ── 1. اختيار الرقم الافتراضي ────────────────────────────────────────────────
  useEffect(() => {
    if (selectedNumberId || !numbers.length) return;
    const preferred =
      numbers.find((n) => n.phone_status === "CONNECTED" || n.phone_status === "active") || numbers[0];
    setSelectedNumberId(preferred.id);
  }, [numbers, selectedNumberId]);

  // ── 2. Conversations (page 1 + load more) ────────────────────────────────────
  const loadConversations = useCallback(async (page = 1) => {
    if (!selectedNumberId) return;
    const reqId = ++convReqRef.current;
    if (page === 1) setConvsLoading(true); else setConvsLoadingMore(true);
    try {
      const r = await getWhatsAppConversations({
        whats_item_id: selectedNumberId, page, per_page: CONVS_PER_PAGE,
      });
      if (reqId !== convReqRef.current) return;
      const list = r.data?.data ?? [];
      setConversations((prev) => (page === 1 ? list : appendUnique(prev, list, "phone")));
      setConvPage(page);
      setConvHasMore(list.length >= CONVS_PER_PAGE);
    } catch (err) {
      if (reqId === convReqRef.current) toast.error(err.response?.data?.message || "تعذر تحميل المحادثات");
    } finally {
      if (reqId === convReqRef.current) { setConvsLoading(false); setConvsLoadingMore(false); }
    }
  }, [selectedNumberId]);

  useEffect(() => {
    setSelectedConv(null);
    setMessages([]);
    setConversations([]);
    loadConversations(1);
  }, [loadConversations]);

  // ── 3. Messages (page 1 = الأحدث، الصفحات بعدها أقدم) ────────────────────────
  const loadMessages = useCallback(async (page = 1) => {
    if (!selectedNumberId || !selectedPhone) return;
    const reqId = ++msgReqRef.current;
    if (page === 1) setMsgsLoading(true); else setMsgsLoadingMore(true);
    try {
      const r = await getWhatsAppMessages({
        whats_item_id: selectedNumberId, phone: selectedPhone, page, per_page: MSGS_PER_PAGE,
      });
      if (reqId !== msgReqRef.current) return;
      const list = [...(r.data?.data ?? [])].reverse(); // عرض من الأقدم للأحدث
      if (page === 1) {
        setMessages(list);
      } else {
        prevHeightRef.current = listRef.current?.scrollHeight ?? null;
        setMessages((prev) => prependUnique(list, prev));
      }
      setMsgPage(page);
      setMsgHasMore((r.data?.data ?? []).length >= MSGS_PER_PAGE);
    } catch (err) {
      if (reqId === msgReqRef.current) toast.error(err.response?.data?.message || "تعذر تحميل الرسائل");
    } finally {
      if (reqId === msgReqRef.current) { setMsgsLoading(false); setMsgsLoadingMore(false); }
    }
  }, [selectedNumberId, selectedPhone]);

  useEffect(() => {
    setMessages([]);
    setMsgHasMore(false);
    if (selectedPhone) loadMessages(1);
  }, [loadMessages, selectedPhone]);

  // ── Scroll: لتحت مع الرسائل الجديدة، ويحافظ على المكان مع الرسائل الأقدم ────
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prevHeightRef.current != null) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = null;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── تحديث المحادثة في القائمة وتحريكها لأول القائمة ──────────────────────────
  const bumpConversation = useCallback((phone, msg) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.phone === phone);
      if (idx === -1) return prev;
      const updated = {
        ...prev[idx],
        last_message: msg.is_image ? "📷 صورة" : msg.message,
        last_message_at: msg.created_at,
        last_sender_type: isAdminMsg(msg) ? "admin" : msg.sender_type,
        unread_count: 0,
      };
      return [updated, ...prev.filter((_, i) => i !== idx)];
    });
  }, []);

  // ── 4. Real-time Echo / Reverb ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedNumberId || !selectedPhone) return;
    const echo = getEcho();
    const channelName = `userWhats_${selectedPhone}_${selectedNumberId}`;

    echo.channel(channelName).listen(".MessageSent", (e) => {
      const incoming = e.message || e;
      const fromCustomer = !isAdminMsg(incoming);

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        // رسالتي أنا رجعت من الـ realtime: نستبدل الـ optimistic بدل ما تتكرر
        if (!fromCustomer) {
          const i = prev.findIndex((m) => m._optimistic && m.message === incoming.message);
          if (i !== -1) { const next = [...prev]; next[i] = incoming; return next; }
        }
        return [...prev, incoming];
      });
      bumpConversation(selectedPhone, incoming);
      if (fromCustomer) markReadRef.current(selectedNumberId, selectedPhone);
    });

    return () => echo.leave(channelName);
  }, [selectedNumberId, selectedPhone, bumpConversation]);

  // ── فتح محادثة ──────────────────────────────────────────────────────────────
  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    if (conv.unread_count > 0) {
      markRead(selectedNumberId, conv.phone);
      setConversations((prev) => prev.map((c) => (c.phone === conv.phone ? { ...c, unread_count: 0 } : c)));
    }
  };

  // ── 5. Send Message (usePost) ───────────────────────────────────────────────
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedNumberId || !selectedPhone || sending) return;

    const optimistic = {
      id: `opt_${Date.now()}`,
      _optimistic: true,
      message: text,
      is_admin: true,
      sender_type: "admin",
      is_image: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText("");

    const result = await sendPost(SEND_URL, {
      whats_item_id: selectedNumberId,
      phone: selectedPhone,
      message: text,
    });

    if (!result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setMessageText(text); // نرجّع النص عشان المستخدم ما يكتبوش تاني
      toast.error(result.error);
    } else {
      // لو الـ API رجّع الرسالة المحفوظة نستبدل بيها (بشرط تكون object فيها id)
      const saved = result.data?.data;
      if (saved && !Array.isArray(saved) && saved.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev.filter((m) => m.id !== optimistic.id);
          return prev.map((m) => (m.id === optimistic.id ? saved : m));
        });
      }
      bumpConversation(selectedPhone, optimistic);
    }
    inputRef.current?.focus();
  };

  const filteredConvs = conversations.filter((c) =>
    (c.name || "").toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.phone || "").toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.last_message || "").toLowerCase().includes(convSearch.toLowerCase())
  );

  // ─── Group messages by date ───────────────────────────────────────────────
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = msg.created_at
      ? new Date(msg.created_at).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })
      : "اليوم";
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", height: "100vh", background: WA.bg, fontFamily: "'Segoe UI',Tahoma,Arial,sans-serif", direction: "rtl", overflow: "hidden" }}>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside style={{ width: 380, background: WA.sidebar, display: "flex", flexDirection: "column", borderLeft: `1px solid ${WA.border}`, flexShrink: 0 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: WA.header }}>
          <WaAvatar name="أنا" size={40} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <WaLogo size={26} />
            <span style={{ color: WA.text, fontWeight: 700, fontSize: 18 }}>WhatsApp</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={waBtn} onClick={() => loadConversations(1)} title="تحديث">
              <RefreshCw size={18} color={WA.textMuted} />
            </button>
            <button style={waBtn}><MoreVertical size={18} color={WA.textMuted} /></button>
          </div>
        </div>

        {/* WhatsApp Numbers Dropdown */}
        {numbers.length > 0 && (
          <div style={{ padding: "8px 12px" }}>
            <select
              style={{ width: "100%", background: WA.searchInput, border: "none", borderRadius: 8, color: WA.text, padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}
              value={selectedNumberId ?? ""}
              onChange={(e) => setSelectedNumberId(Number(e.target.value))}
            >
              {numbers.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.phone}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: WA.searchInput, borderRadius: 8, padding: "8px 12px" }}>
            <Search size={16} color={WA.textMuted} />
            <input
              style={{ background: "transparent", border: "none", outline: "none", color: WA.text, fontSize: 14, flex: 1, textAlign: "right" }}
              placeholder="ابحث برقم الهاتف أو الاسم..."
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {numbersLoading || convsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={28} color={WA.green} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
              <MessageSquare size={40} color={WA.textMuted} />
              <p style={{ color: WA.textMuted, marginTop: 8, fontSize: 13 }}>لا توجد محادثات</p>
            </div>
          ) : filteredConvs.map((conv) => (
            <motion.div
              key={conv.phone}
              whileHover={{ backgroundColor: WA.convHover }}
              onClick={() => handleSelectConv(conv)}
              style={{
                display: "flex", alignItems: "center", padding: "10px 16px", gap: 12,
                cursor: "pointer", borderBottom: `1px solid ${WA.border}`,
                background: selectedConv?.phone === conv.phone ? WA.convSelected : "transparent",
                transition: "background 0.15s",
              }}
            >
              <WaAvatar name={conv.name || conv.phone || "?"} size={50} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: WA.text, fontWeight: conv.unread_count > 0 ? 700 : 500, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>
                    {conv.name || conv.phone}
                  </span>
                  <span style={{ color: conv.unread_count > 0 ? WA.green : WA.textMuted, fontSize: 11, flexShrink: 0 }}>
                    {fmt(conv.last_message_at)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontSize: 13, color: WA.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210, fontWeight: conv.unread_count > 0 ? 600 : 400, ...(conv.unread_count > 0 && { color: WA.text }) }}>
                    {conv.last_sender_type === "admin" && <CheckCheck size={14} color={WA.green} style={{ display: "inline", marginLeft: 3 }} />}
                    {conv.last_message?.slice(0, 38)}{conv.last_message?.length > 38 ? "..." : ""}
                  </span>
                  {conv.unread_count > 0 && (
                    <span style={{ background: WA.green, color: "#fff", borderRadius: 10, padding: "2px 7px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {convHasMore && !convsLoading && (
            <button
              onClick={() => loadConversations(convPage + 1)}
              disabled={convsLoadingMore}
              style={{ ...waBtn, width: "100%", borderRadius: 0, padding: 12, color: WA.green, fontSize: 13 }}
            >
              {convsLoadingMore ? <Loader2 size={18} color={WA.green} style={{ animation: "spin 1s linear infinite" }} /> : "تحميل المزيد"}
            </button>
          )}
        </div>
      </aside>

      {/* ── Chat Area ──────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* WhatsApp wallpaper pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a884' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: "none", zIndex: 0,
        }} />

        {!selectedConv ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 1 }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#00a884,#008069)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <WaLogo size={54} />
              </div>
              <h2 style={{ color: WA.text, marginTop: 24, fontSize: 22, fontWeight: 700 }}>WhatsApp Business</h2>
              <p style={{ color: WA.textMuted, marginTop: 10, fontSize: 14 }}>اختر محادثة للبدء</p>
              <div style={{ height: 1, background: WA.border, margin: "24px auto", width: 200 }} />
              <p style={{ color: WA.textMuted, fontSize: 12 }}>
                🔒 رسائلك مشفرة بالكامل
              </p>
            </motion.div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", zIndex: 1 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", background: WA.header, gap: 10, zIndex: 2 }}>
              <button style={waBtn} onClick={() => setSelectedConv(null)}><ChevronLeft size={22} color={WA.textMuted} /></button>
              <WaAvatar name={selectedConv.name || selectedConv.phone || "?"} size={40} />
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ color: WA.text, fontWeight: 700, fontSize: 15 }}>{selectedConv.name || selectedConv.phone}</div>
                <div style={{ color: WA.green, fontSize: 12 }}>{selectedConv.phone}</div>
              </div>
              <button style={waBtn}><MoreVertical size={18} color={WA.textMuted} /></button>
            </div>

            {/* Messages */}
            <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column" }}>
              {msgsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Loader2 size={30} color={WA.green} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <>
                  {msgHasMore && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <button
                        onClick={() => loadMessages(msgPage + 1)}
                        disabled={msgsLoadingMore}
                        style={{ ...waBtn, borderRadius: 8, padding: "6px 14px", background: "rgba(17,27,33,0.85)", color: WA.green, fontSize: 12 }}
                      >
                        {msgsLoadingMore ? <Loader2 size={16} color={WA.green} style={{ animation: "spin 1s linear infinite" }} /> : "تحميل رسائل أقدم"}
                      </button>
                    </div>
                  )}
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date divider */}
                      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                        <span style={{ background: "rgba(17,27,33,0.85)", color: WA.textMuted, fontSize: 12, padding: "4px 12px", borderRadius: 8 }}>
                          {date}
                        </span>
                      </div>
                      <AnimatePresence initial={false}>
                        {msgs.map((msg) => {
                          const isAdmin = msg.is_admin || msg.sender_type === "admin";
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18 }}
                              style={{ display: "flex", justifyContent: isAdmin ? "flex-start" : "flex-end", marginBottom: 4 }}
                            >
                              <div style={{
                                maxWidth: "65%",
                                background: isAdmin ? WA.outBubble : WA.inBubble,
                                borderRadius: isAdmin ? "8px 8px 8px 2px" : "8px 8px 2px 8px",
                                padding: msg.is_image ? 4 : "8px 12px",
                                position: "relative",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              }}>
                                {/* Tail */}
                                <div style={{
                                  position: "absolute",
                                  bottom: 0,
                                  [isAdmin ? "right" : "left"]: -7,
                                  width: 0, height: 0,
                                  borderStyle: "solid",
                                  borderWidth: isAdmin ? "0 8px 8px 0" : "0 0 8px 8px",
                                  borderColor: isAdmin
                                    ? `transparent ${WA.outBubble} transparent transparent`
                                    : `transparent transparent ${WA.inBubble} transparent`,
                                }} />

                                {msg.is_image ? (
                                  <img src={msg.message} alt="img" style={{ maxWidth: 220, borderRadius: 6, display: "block" }} />
                                ) : (
                                  <span style={{ color: WA.text, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>
                                    {msg.message}
                                  </span>
                                )}

                                {/* Time + ticks */}
                                <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 3 }}>
                                  <span style={{ color: WA.textMuted, fontSize: 10 }}>{msgTime(msg.created_at)}</span>
                                  {isAdmin && (msg.is_read
                                    ? <CheckCheck size={14} color="#53bdeb" />
                                    : <Check size={14} color={WA.textMuted} />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: WA.inputArea }}>
              <button style={waBtn}><Smile size={22} color={WA.textMuted} /></button>
              <button style={waBtn}><Paperclip size={20} color={WA.textMuted} /></button>
              <div style={{ flex: 1, background: WA.searchInput, borderRadius: 24, display: "flex", alignItems: "center", padding: "0 14px" }}>
                <input
                  ref={inputRef}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: WA.text, fontSize: 14, padding: "10px 0", textAlign: "right" }}
                  placeholder="اكتب رسالة..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${WA.green}, ${WA.greenDark})`,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {sending
                  ? <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={20} color="#fff" style={{ transform: "rotate(180deg)" }} />
                }
              </motion.button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374045; border-radius: 5px; }
      `}</style>
    </div>
  );
}

const waBtn = {
  background: "transparent", border: "none", cursor: "pointer",
  padding: 6, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
};