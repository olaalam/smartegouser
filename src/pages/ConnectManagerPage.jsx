import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, Check, ChevronRight, CircleAlert, Link2, MessageCircle, MessageSquare, RefreshCw } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { formatAvailableMessages, hasChatAccess } from "../utils/chatAccess";
import { localizeApiLabel } from "../utils/localization";

const WHATSAPP_NUMBERS_URL = "user/chat/whatsapp/numbers";

const COPY = {
  en: {
    title: "Connect accounts", subtitle: "Connect your messaging channels and manage their inboxes from one place.",
    available: "Available connections", connected: (count) => `${count} connected`, notConnected: "Not connected",
    active: "Subscription active", subscribe: "Subscription required", connect: "Connect account",
    openChat: "Open inbox", manage: "Manage", loading: "Loading connections…", retry: "Try again",
    noRecords: "No accounts connected yet.", accounts: "Accounts", messages: (count) => `${count} messages available`,
    whatsappDescription: "Link a WhatsApp Business number and reply to customers.",
    messengerDescription: "Connect a Facebook page to manage Messenger conversations.",
    instagramDescription: "Connect an Instagram account to manage Direct messages.",
    whatsappConnect: "Set up WhatsApp", messengerStatus: "Available", messengerPrompt: "Open Facebook Pages to connect or manage your pages.", messengerPages: "Facebook Pages", instagramConnect: "Connect Instagram",
    status: "Status", allChannels: "Messaging channels", secure: "Account connection",
  },
  ar: {
    title: "ربط الحسابات", subtitle: "اربطي قنوات المراسلة وأديري محادثاتها من مكان واحد.",
    available: "القنوات المتاحة", connected: (count) => `${count} متصل`, notConnected: "غير متصل",
    active: "الاشتراك نشط", subscribe: "الاشتراك مطلوب", connect: "ربط حساب",
    openChat: "فتح المحادثات", manage: "إدارة", loading: "جاري تحميل الاتصالات…", retry: "حاولي مرة أخرى",
    noRecords: "لا توجد حسابات متصلة بعد.", accounts: "الحسابات", messages: (count) => `${count} رسالة متاحة`,
    whatsappDescription: "اربطي رقم WhatsApp Business للرد على العملاء.",
    messengerDescription: "اربطي صفحة فيسبوك لإدارة محادثات Messenger.",
    instagramDescription: "اربطي حساب Instagram لإدارة رسائل Direct.",
    whatsappConnect: "إعداد WhatsApp", messengerStatus: "متاح", messengerPrompt: "افتحي صفحات فيسبوك لربط الصفحات أو إدارتها.", messengerPages: "صفحات فيسبوك", instagramConnect: "ربط Instagram",
    status: "الحالة", allChannels: "قنوات المراسلة", secure: "اتصال الحساب",
  },
};

function ConnectionCard({ icon: Icon, title, description, accent, records, loading, error, t, lang, getName, getDetails, getStatus, getAction, onConnect, onCardClick, connectLabel, statusText, emptyText, onRetry }) {
  const activeCount = records.filter(hasChatAccess).length;
  const connected = records.length > 0;
  const statusLabel = statusText || (!connected ? t.notConnected : activeCount ? t.active : t.subscribe);

  return (
    <article
      role={onCardClick ? "link" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={onCardClick}
      onKeyDown={onCardClick ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCardClick();
        }
      } : undefined}
      className={`flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e4e7ec] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)] ${onCardClick ? "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866ff]" : ""}`}
    >
      <header className="flex min-h-[104px] items-start gap-3 border-b border-[#f0f1f3] p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}15`, color: accent }}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#1d2939]">{title}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${activeCount ? "bg-emerald-50 text-emerald-700" : connected ? "bg-amber-50 text-amber-700" : "bg-[#f2f4f7] text-[#667085]"}`}>
              {activeCount > 0 && <Check className="h-3 w-3" aria-hidden="true" />}{statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-[#667085]">
          <span>{t.accounts}</span>
          {connected && <span>{t.connected(records.length)}</span>}
        </div>

        {loading ? (
          <div className="grid min-h-20 place-items-center text-xs text-[#667085]">{t.loading}</div>
        ) : error ? (
          <div className="flex min-h-20 items-center gap-2 text-xs text-red-600">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">{error}</span>
            <button type="button" onClick={onRetry} aria-label={t.retry} title={t.retry} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-red-50">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : !connected ? (
          <p className="grid min-h-20 place-items-center text-center text-xs text-[#8a8f98]">{emptyText || t.noRecords}</p>
        ) : (
          <ul className="min-h-20 divide-y divide-[#f0f1f3]">
            {records.map((record) => {
              const subscribed = hasChatAccess(record);
              return (
                <li key={record.id ?? record.page_id ?? record.instagram_id ?? record.phone} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#344054]">{getName(record)}</span>
                    <span className="mt-1 block truncate text-[11px] text-[#8a8f98]">{getDetails(record)}</span>
                  </span>
                  <span className={`hidden shrink-0 text-[10px] sm:inline ${subscribed ? "text-emerald-700" : "text-[#8a8f98]"}`}>
                    {localizeApiLabel(getStatus(record), lang, subscribed ? t.active : t.subscribe)}
                  </span>
                  {!onCardClick && (
                    <button type="button" onClick={(event) => { event.stopPropagation(); getAction(record, subscribed); }}
                      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: subscribed ? accent : "#344054" }}>
                      {subscribed ? t.openChat : t.subscribe}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {(onCardClick || (!connected && !loading)) && (
          onCardClick ? (
            <span className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>
              <Link2 className="h-4 w-4" aria-hidden="true" />{connectLabel}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : (
            <button type="button" onClick={(event) => { event.stopPropagation(); onConnect(); }} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: accent }}>
              <Link2 className="h-4 w-4" aria-hidden="true" />{connectLabel}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )
        )}
      </div>
    </article>
  );
}

export default function ConnectManagerPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const navigate = useNavigate();
  const instagram = useGet(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
  const whatsapp = useGet(WHATSAPP_NUMBERS_URL, { per_page: 100 });
  const instagramAccounts = useMemo(() => instagram.data?.data ?? [], [instagram.data]);
  const whatsappNumbers = useMemo(() => whatsapp.data?.data ?? [], [whatsapp.data]);

  const connections = [
    {
      key: "whatsapp", title: "WhatsApp", description: t.whatsappDescription, icon: MessageCircle, accent: "#20a663",
      records: whatsappNumbers, loading: whatsapp.loading, error: whatsapp.error, refetch: whatsapp.refetch,
      getName: (number) => number.phone || number.verified_name || t.title,
      getDetails: (number) => [number.verified_name, number.available_msgs !== undefined ? t.messages(formatAvailableMessages(number.available_msgs)) : null].filter(Boolean).join(" · "),
      getStatus: (number) => number.subscription_status,
      onAction: (number, subscribed) => navigate(subscribed ? "/whatsapp-chat" : number.phone_verified_at ? "/whatsapp?step=package" : "/whatsapp"),
      onConnect: () => navigate("/whatsapp"), connectLabel: t.whatsappConnect,
    },
    {
      key: "messenger", title: "Messenger", description: t.messengerDescription, icon: MessageSquare, accent: "#0866ff",
      records: [], loading: false, error: null,
      onCardClick: () => navigate("/fb-pages"),
      connectLabel: t.messengerPages, statusText: t.messengerStatus, emptyText: t.messengerPrompt,
    },
    {
      key: "instagram", title: "Instagram", description: t.instagramDescription, icon: Camera, accent: "#d9468d",
      records: instagramAccounts, loading: instagram.loading, error: instagram.error, refetch: instagram.refetch,
      getName: (account) => account.username ? `@${account.username}` : account.name || account.instagram_id,
      getDetails: (account) => [account.connected_page_name, account.available_msgs !== undefined ? t.messages(formatAvailableMessages(account.available_msgs)) : null].filter(Boolean).join(" · "),
      getStatus: (account) => account.subscription_status,
      onAction: (_account, subscribed) => navigate(subscribed ? "/instagram-chat" : "/instagram-subscription"),
      onConnect: () => navigate("/instagram-subscription"), connectLabel: t.instagramConnect,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-7 text-[#1d2939] sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#667085]">
              <Link2 className="h-4 w-4" aria-hidden="true" />{t.allChannels}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#667085]">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#e4e7ec] bg-white px-3 py-2 text-xs text-[#667085]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />{t.secure}
          </div>
        </header>

        <section aria-labelledby="available-connections-heading">
          <div className="mb-4 flex items-center justify-between border-b border-[#e4e7ec] pb-3">
            <h2 id="available-connections-heading" className="text-sm font-semibold">{t.available}</h2>
            <span className="text-xs text-[#667085]">{connections.length}</span>
          </div>
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {connections.map(({ key, ...connection }) => (
              <ConnectionCard key={key} {...connection} t={t} lang={lang} getAction={connection.onAction} onConnect={connection.onConnect} onRetry={connection.refetch} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
