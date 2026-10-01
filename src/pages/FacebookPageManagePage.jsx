import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { PanelsTopLeft, MessageCircle, MessageSquare, ArrowUpRight, CreditCard, Info } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";
import AISettingsPanel from "../components/messenger/AISettingsPanel";
import { formatAvailableMessages } from "../utils/chatAccess";
import { localizeApiLabel } from "../utils/localization";

const copy = {
  en: {
    back: "All Facebook pages", manage: "Page management", details: "Page details", info: "Info", chats: "Chats",
    messenger: "Facebook Chat", whatsapp: "WhatsApp Chat", subscription: "Subscription",
    ai: "AI settings",
    pageId: "Page ID", category: "Category", subscriptionStatus: "Subscription status", availableMessages: "Available messages",
    active: "Active", inactive: "Not active", loading: "Loading page details…", retry: "Try again",
    missing: "Facebook page not found", missingHelp: "The page may have been disconnected. Refresh your page list and try again.",
  },
  ar: {
    back: "كل صفحات فيسبوك", manage: "إدارة الصفحة", details: "تفاصيل الصفحة", info: "المعلومات", chats: "المحادثات",
    messenger: "شات فيسبوك", whatsapp: "شات واتساب", subscription: "الاشتراك",
    ai: "إعدادات AI",
    pageId: "معرّف الصفحة", category: "التصنيف", subscriptionStatus: "حالة الاشتراك", availableMessages: "الرسائل المتاحة",
    active: "نشط", inactive: "غير نشط", loading: "جاري تحميل تفاصيل الصفحة…", retry: "حاول مرة أخرى",
    missing: "صفحة فيسبوك غير موجودة", missingHelp: "قد تكون الصفحة غير متصلة. حدّث قائمة الصفحات وحاولي مرة أخرى.",
  },
};

function PageBrand({ page }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = page.picture?.data?.url || page.picture?.url || page.profile_picture || page.page_picture || page.logo || page.avatar;
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[oklch(0.94_0.05_240)] text-xl font-bold text-[oklch(0.42_0.14_240)]">
      {image && !imageFailed
        ? <img src={image} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
        : page.page_name?.charAt(0)?.toUpperCase() || "F"}
    </div>
  );
}

export default function FacebookPageManagePage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const lang = useSelector((state) => state.ui.lang);
  const t = copy[lang] ?? copy.en;
  const [activeTab, setActiveTab] = useState("info");
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.MESSENGER.PAGES);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);
  const pages = data?.data ?? [];
  const page = pages.find((item) => String(item.page_id) === pageId);
  const details = [
    [t.pageId, page?.page_id],
    [t.category, page?.page_category],
    [t.subscriptionStatus, localizeApiLabel(page?.subscription_status, lang, t.inactive)],
    [t.availableMessages, formatAvailableMessages(page?.available_msgs)],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        {showLoader ? <div className="grid min-h-[320px] place-items-center border-y border-[var(--border)] bg-[var(--card)]"><Loader text={t.loading} /></div>
          : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>
              <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
                {t.retry}
              </button>
            </div>
          )
            : !page ? <EmptyState icon={PanelsTopLeft} title={t.missing} description={t.missingHelp} />
              : (
                <div className="space-y-6">
                  <button type="button" onClick={() => navigate("/fb-pages")} className="text-sm font-medium text-[var(--primary)] hover:underline">
                    {t.back}
                  </button>

                  <header className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] pb-5">
                    <PageBrand page={page} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{t.manage}</p>
                      <h1 className="mt-1 truncate text-2xl font-bold text-[var(--foreground)]">{page.page_name}</h1>
                    </div>
                  </header>

                  <div role="tablist" aria-label={t.manage} className="flex border-b border-[var(--border)]">
                    {[["info", t.info, Info], ["chats", t.chats, MessageSquare]].map(([key, label, Icon]) => (
                      <button key={key} id={`facebook-${key}-tab`} type="button" role="tab" aria-selected={activeTab === key}
                        aria-controls={`facebook-${key}-panel`} onClick={() => setActiveTab(key)}
                        className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${activeTab === key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />{label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "info" ? (
                    <section id="facebook-info-panel" role="tabpanel" aria-labelledby="facebook-info-tab" className="space-y-6">
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
                      <AISettingsPanel key={page.page_id} pageId={page.page_id} lang={lang} />
                    </section>
                  ) : (
                    <section id="facebook-chats-panel" role="tabpanel" aria-labelledby="facebook-chats-tab" className="grid max-w-3xl gap-5 sm:grid-cols-2">
                      {[[t.messenger, MessageSquare, "text-[oklch(0.42_0.14_240)]", () => navigate(`/messenger-chat?pageId=${encodeURIComponent(page.page_id)}`)],
                        [t.whatsapp, MessageCircle, "text-[oklch(0.4_0.14_155)]", () => navigate("/whatsapp-chat")]].map(([label, Icon, color, open]) => (
                        <div key={label} className="flex min-h-32 items-center justify-between gap-4 border-y border-[var(--border)] py-5">
                          <div className="flex items-center gap-3"><Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden="true" /><h2 className="text-sm font-semibold text-[var(--foreground)]">{label}</h2></div>
                          <button type="button" onClick={open} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />{t.manage}
                          </button>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              )}
      </main>
    </div>
  );
}