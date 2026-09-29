import { useState } from "react";
import { useSelector } from "react-redux";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, MessageCircle, MessageSquare, Search, SlidersHorizontal } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import { API_ENDPOINTS } from "../utils/constants";
import Navbar from "../components/layout/Navbar";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";

const text = {
  en: {
    title: "User Orders", subtitle: "Review pending requests and your order history.",
    pending: "Pending orders", history: "Order history", search: "Search by package or page/number",
    userId: "User ID", status: "Status", allStatuses: "All statuses", pendingStatus: "Pending",
    approved: "Approved", rejected: "Rejected", packageId: "Package ID", channel: "Channel",
    allChannels: "All channels", messenger: "Facebook", whatsapp: "WhatsApp", perPage: "Per page",
    apply: "Apply filters", loading: "Loading orders…", emptyPending: "No pending orders",
    emptyHistory: "No orders found", emptyDescription: "Try changing your filters.",
    package: "Package", account: "Account", page: "Page", number: "Number", messages: "messages", period: "Period",
    total: "Total", tax: "Tax", discount: "Discount", order: "Order", created: "Placed",
    previous: "Previous page", next: "Next page", pageOf: (page, total) => `Page ${page} of ${total}`,
    tryAgain: "Try again", failed: "Could not load orders", unknownPackage: "Package",
  },
  ar: {
    title: "طلبات المستخدم", subtitle: "تابعي الطلبات المعلقة وسجل الطلبات.",
    pending: "الطلبات المعلقة", history: "سجل الطلبات", search: "بحث بالباقة أو الصفحة/الرقم",
    userId: "رقم المستخدم", status: "الحالة", allStatuses: "كل الحالات", pendingStatus: "معلق",
    approved: "مقبول", rejected: "مرفوض", packageId: "رقم الباقة", channel: "القناة",
    allChannels: "كل القنوات", messenger: "فيسبوك", whatsapp: "واتساب", perPage: "لكل صفحة",
    apply: "تطبيق الفلاتر", loading: "جاري تحميل الطلبات…", emptyPending: "لا توجد طلبات معلقة",
    emptyHistory: "لا توجد طلبات", emptyDescription: "جربي تغيير الفلاتر.",
    package: "الباقة", account: "الحساب", page: "صفحة", number: "رقم", messages: "رسالة", period: "الفترة",
    total: "الإجمالي", tax: "الضريبة", discount: "الخصم", order: "طلب", created: "تاريخ الطلب",
    previous: "الصفحة السابقة", next: "الصفحة التالية", pageOf: (page, total) => `صفحة ${page} من ${total}`,
    tryAgain: "حاولي مرة أخرى", failed: "تعذر تحميل الطلبات", unknownPackage: "باقة",
  },
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

function localized(value, lang, fallback) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return localized(value[0], lang, fallback);
  return value?.[lang] ?? value?.en ?? value?.ar ?? fallback;
}

function getOrders(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getPagination(response) {
  const payload = response?.data;
  return response?.pagination ?? payload?.pagination ?? (payload && !Array.isArray(payload) ? payload : {});
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function OrderRow({ order, lang, t, locale }) {
  const channel = String(order.channel ?? "").toLowerCase();
  const packageName = localized(order.package_name ?? order.package?.name, lang, t.unknownPackage);
  const accountName = channel === "whatsapp"
    ? order.whats_item?.phone ?? (order.whats_item_id ? `${t.number} ${order.whats_item_id}` : null)
    : order.messengerAccount?.page_name ?? (order.messenger_account_id ? `${t.page} ${order.messenger_account_id}` : null);
  const status = String(order.status ?? "pending").toLowerCase();
  const statusLabel = status === "pending" ? t.pendingStatus : t[status] ?? order.status ?? t.pendingStatus;
  const orderPeriod = order.from || order.to
    ? `${formatDate(order.from, locale)} – ${formatDate(order.to, locale)}`
    : "—";
  const ChannelIcon = channel === "whatsapp" ? MessageCircle : MessageSquare;

  return (
    <article className="border-b border-[var(--border)] px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${channel === "whatsapp" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"}`}>
            <ChannelIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">{packageName}</h3>
            <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">{t.order} #{order.id} · {channel === "whatsapp" ? t.whatsapp : t.messenger}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
          {statusLabel}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs text-[var(--muted-foreground)]">{t.account}</dt>
          <dd className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">{accountName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-foreground)]">{t.messages}</dt>
          <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{Number(order.msgs ?? 0).toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-foreground)]">{t.period}</dt>
          <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{orderPeriod}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--muted-foreground)]">{t.created}</dt>
          <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{formatDate(order.created_at, locale)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
        <span>{t.packageId}: {order.package?.id ?? "—"}</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {Number(order.total_discount) > 0 && <span>{t.discount}: {order.total_discount}</span>}
          {Number(order.total_tax) > 0 && <span>{t.tax}: {order.total_tax}</span>}
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--foreground)]"><CreditCard className="h-3.5 w-3.5" aria-hidden="true" />{t.total}: {order.final_price ?? order.price ?? 0}</span>
        </div>
      </div>
    </article>
  );
}

export default function UserOrdersPage() {
  const user = useSelector((state) => state.auth.user);
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = text[lang] ?? text.en;
  const locale = isRTL ? "ar-EG" : "en-GB";
  const [activeTab, setActiveTab] = useState("history");
  const [filters, setFilters] = useState(() => ({
    user_id: user?.id ?? user?.user_id ?? "",
    status: "",
    search: "",
    package_id: "",
    channel: "",
    per_page: 10,
    page: 1,
  }));
  const [draft, setDraft] = useState(filters);
  const baseApiFilters = Object.fromEntries(Object.entries(filters)
    .filter(([key, value]) => key !== "status" && value !== "" && value != null));
  const historyStatus = ["approved", "rejected"].includes(filters.status) ? filters.status : "";
  const historyApiFilters = historyStatus ? { ...baseApiFilters, status: historyStatus } : baseApiFilters;
  const historyRequest = useGet(API_ENDPOINTS.USER.HISTORY_ORDERS, historyApiFilters);
  const pendingRequest = useGet(API_ENDPOINTS.USER.PENDING_ORDERS, baseApiFilters);
  const request = activeTab === "history" ? historyRequest : pendingRequest;
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(request.loading);
  const orders = getOrders(request.data);
  const pagination = getPagination(request.data);
  const currentPage = Number(pagination.current_page ?? filters.page ?? 1);
  const lastPage = Number(pagination.last_page ?? currentPage);
  const hasPrevious = currentPage > 1;
  const hasNext = pagination.has_more ?? (currentPage < lastPage || orders.length >= Number(filters.per_page));

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const applyFilters = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== "" && value != null));
    setFilters({ ...next, page: 1 });
  };
  const changePage = (page) => setFilters((current) => ({ ...current, page }));
  const emptyTitle = activeTab === "history" ? t.emptyHistory : t.emptyPending;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
        </header>

        <div className="flex gap-1 border-b border-[var(--border)]" role="tablist" aria-label={t.title}>
          {[["history", t.history], ["pending", t.pending]].map(([tab, label]) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
              className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors ${activeTab === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={applyFilters} className="grid gap-3 border-y border-[var(--border)] py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.search}</span>
            <span className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
              <input maxLength={255} value={draft.search} onChange={(event) => updateDraft("search", event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none" />
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.status}</span>
            <select value={activeTab === "pending" ? "pending" : draft.status} disabled={activeTab === "pending"} onChange={(event) => updateDraft("status", event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] disabled:opacity-70">
              {activeTab === "pending" ? <option value="pending">{t.pendingStatus}</option> : <>
                <option value="">{t.allStatuses}</option><option value="approved">{t.approved}</option><option value="rejected">{t.rejected}</option>
              </>}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.packageId}</span>
            <input type="number" min="1" value={draft.package_id} onChange={(event) => updateDraft("package_id", event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.channel}</span>
            <select value={draft.channel} onChange={(event) => updateDraft("channel", event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
              <option value="">{t.allChannels}</option><option value="messenger">{t.messenger}</option><option value="whatsapp">{t.whatsapp}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.userId}</span>
            <input type="number" min="1" value={draft.user_id} onChange={(event) => updateDraft("user_id", event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t.perPage}</span>
            <select value={draft.per_page} onChange={(event) => updateDraft("per_page", Number(event.target.value))} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
              {[10, 15, 25, 50, 100].map((amount) => <option key={amount} value={amount}>{amount}</option>)}
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-2">
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto" style={{ background: "var(--primary)" }}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t.apply}
            </button>
          </div>
        </form>

        <section aria-label={activeTab === "history" ? t.history : t.pending}>
          {showLoader ? (
            <div className="grid min-h-[300px] place-items-center border-y border-[var(--border)] bg-[var(--card)]"><Loader text={t.loading} /></div>
          ) : request.error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <p role="alert" className="text-sm text-[var(--destructive)]">{request.error || t.failed}</p>
              <button type="button" onClick={() => { beginLoading(); request.refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>{t.tryAgain}</button>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={CalendarDays} title={emptyTitle} description={t.emptyDescription} />
          ) : (
            <div className="border-y border-[var(--border)] bg-[var(--card)]">
              {orders.map((order) => <OrderRow key={order.id} order={order} lang={lang} t={t} locale={locale} />)}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-5">
                <span className="text-xs text-[var(--muted-foreground)]">{t.pageOf(currentPage, Math.max(lastPage, currentPage))}</span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={!hasPrevious} onClick={() => changePage(currentPage - 1)} aria-label={t.previous}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40">
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <button type="button" disabled={!hasNext} onClick={() => changePage(currentPage + 1)} aria-label={t.next}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40">
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}