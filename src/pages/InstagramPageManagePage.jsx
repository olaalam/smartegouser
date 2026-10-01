import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Camera, CreditCard, Info, MessageCircle, MessageSquare } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import { formatAvailableMessages, hasChatAccess } from "../utils/chatAccess";
import { localizeApiLabel } from "../utils/localization";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";
import { InstagramAISettings } from "../components/messenger/AISettingsPanel";

const copy = {
  en: {
    back: "All connected pages", title: "Account management", details: "Account details", info: "Info", chats: "Chats",
    inbox: "Instagram messages", openInbox: "Open Instagram inbox", subscription: "Subscription", accountId: "Instagram ID",
    username: "Username", linkedPage: "Connected Facebook Page", status: "Subscription status",
    messages: "Available messages", active: "Active", inactive: "Not active",
    loading: "Loading account details…", retry: "Try again", missing: "Instagram account not found",
    missingHelp: "The account may have been disconnected. Return to the account list and try again.",
  },
  ar: {
    back: "كل الصفحات المتصلة", title: "إدارة الحساب", details: "بيانات الحساب", info: "المعلومات", chats: "المحادثات",
    inbox: "رسائل Instagram", openInbox: "فتح رسائل Instagram", subscription: "الاشتراك", accountId: "معرّف Instagram",
    username: "اسم المستخدم", linkedPage: "صفحة Facebook المتصلة", status: "حالة الاشتراك",
    messages: "الرسائل المتاحة", active: "نشط", inactive: "غير نشط",
    loading: "جاري تحميل بيانات الحساب…", retry: "حاول مرة أخرى", missing: "حساب Instagram غير موجود",
    missingHelp: "قد يكون الحساب غير متصل. عودي إلى قائمة الحسابات وحاولي مرة أخرى.",
  },
};

export default function InstagramPageManagePage() {
  const { instagramId } = useParams();
  const navigate = useNavigate();
  const lang = useSelector((state) => state.ui.lang);
  const t = copy[lang] ?? copy.en;
  const [activeTab, setActiveTab] = useState("info");
  const { data: accountsData, loading: accountsLoading, error, refetch } = useGet(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
  const { data: chatData, loading: chatLoading } = useGet(API_ENDPOINTS.INSTAGRAM.CHAT_ACCOUNTS);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(accountsLoading || chatLoading);
  const accounts = accountsData?.data ?? [];
  const chatAccounts = chatData?.data ?? [];
  const account = accounts.find((item) => String(item.instagram_id) === instagramId)
    ?? chatAccounts.find((item) => String(item.instagram_id) === instagramId);
  const chatAccount = chatAccounts.find((item) => String(item.instagram_id) === instagramId);
  const status = (chatAccount ?? account)?.subscription_status;
  const details = [
    [t.accountId, account?.instagram_id],
    [t.username, account?.username ? `@${account.username}` : account?.name],
    [t.linkedPage, account?.connected_page_name],
    [t.status, localizeApiLabel(status, lang, t.inactive)],
    [t.messages, formatAvailableMessages((chatAccount ?? account)?.available_msgs)],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        {showLoader ? <div className="grid min-h-[320px] place-items-center border-y border-[var(--border)] bg-[var(--card)]"><Loader text={t.loading} /></div>
          : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>
              <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
                {t.retry}
              </button>
            </div>
          )
            : !account ? <EmptyState icon={Camera} title={t.missing} description={t.missingHelp} />
              : (
                <>
                  <button type="button" onClick={() => navigate("/fb-pages")} className="text-sm font-medium text-[var(--primary)] hover:underline">
                    {t.back}
                  </button>
                  <header className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] pb-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white">
                      {account.profile_picture_url || account.profile_picture
                        ? <img src={account.profile_picture_url || account.profile_picture} alt="" className="h-full w-full object-cover" />
                        : <Camera className="h-6 w-6" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{t.title}</p>
                      <h1 className="mt-1 truncate text-2xl font-bold text-[var(--foreground)]">{account.username ? `@${account.username}` : account.name || account.instagram_id}</h1>
                    </div>
                  </header>

                  <div role="tablist" aria-label={t.title} className="flex border-b border-[var(--border)]">
                    {[["info", t.info, Info], ["chats", t.chats, MessageSquare]].map(([key, label, Icon]) => (
                      <button key={key} id={`instagram-${key}-tab`} type="button" role="tab" aria-selected={activeTab === key}
                        aria-controls={`instagram-${key}-panel`} onClick={() => setActiveTab(key)}
                        className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${activeTab === key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />{label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "info" ? (
                    <section id="instagram-info-panel" role="tabpanel" aria-labelledby="instagram-info-tab" className="space-y-6">
                      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div>
                          <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">{t.details}</h2>
                          <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                            {details.map(([label, value]) => (
                              <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                <dt className="text-sm text-[var(--muted-foreground)]">{label}</dt>
                                <dd className="max-w-full break-all text-sm font-medium text-[var(--foreground)]">{value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                      <InstagramAISettings key={instagramId} instagramId={account.instagram_id} lang={lang} />
                    </section>
                  ) : (
                    <section id="instagram-chats-panel" role="tabpanel" aria-labelledby="instagram-chats-tab" className="max-w-2xl border-y border-[var(--border)] py-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-rose-500"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
                          <div><h2 className="text-base font-semibold text-[var(--foreground)]">{t.inbox}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{account.username ? `@${account.username}` : account.name || account.instagram_id}</p></div>
                        </div>
                        <button type="button" onClick={() => navigate(`/instagram-chat?accountId=${encodeURIComponent(chatAccount?.id ?? account.id)}`)}
                          disabled={!hasChatAccess(chatAccount ?? account)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "var(--primary)" }}>
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />{t.openInbox}
                        </button>
                      </div>
                    </section>
                  )}
                </>
              )}
      </main>
    </div>
  );
}