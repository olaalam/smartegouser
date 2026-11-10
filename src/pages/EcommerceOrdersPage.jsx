import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Search } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { getEcommerceOrder, resendEcommerceOrderConfirmation } from "../api/ecommerceOrdersApi";
import { API_ENDPOINTS } from "../utils/constants";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";

const COPY = {
  en: {
    title: "Store orders",
    subtitle: "Review orders received from your connected stores and track customer edits.",
    search: "Order number, customer, or phone",
    status: "Status",
    allStatuses: "All statuses",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    channel: "WhatsApp number ID",
    apply: "Apply filters",
    loading: "Loading store orders…",
    failed: "Could not load store orders.",
    empty: "No store orders found.",
    order: "Order",
    customer: "Customer",
    phone: "Phone",
    total: "Total",
    platform: "Platform",
    edited: "Edited · awaiting confirmation",
    editing: "Customer editing",
    awaitingEdit: "Waiting for customer edit",
    editStatus: "Edit status",
    lastEdited: "Last edited",
    placed: "Placed",
    details: "Order details",
    close: "Close",
    items: "Items",
    quantity: "Quantity",
    price: "Price",
    resend: "Resend confirmation",
    resending: "Sending…",
    resent: "Confirmation message sent.",
    resendError: "Could not resend the confirmation message.",
    detailError: "Could not load order details.",
    editSnapshot: "Items before edit",
    noItems: "No item details available.",
    previous: "Previous",
    next: "Next",
    page: (current, total) => `Page ${current} of ${total}`,
    noCustomer: "Customer",
  },
  ar: {
    title: "طلبات المتجر",
    subtitle: "راجعي الطلبات الواردة من متاجرك المتصلة وتابعي تعديلات العملاء.",
    search: "رقم الطلب أو اسم العميل أو الهاتف",
    status: "الحالة",
    allStatuses: "كل الحالات",
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    channel: "رقم قناة واتساب",
    apply: "تطبيق الفلاتر",
    loading: "جاري تحميل طلبات المتجر…",
    failed: "تعذر تحميل طلبات المتجر.",
    empty: "لا توجد طلبات متجر.",
    order: "الطلب",
    customer: "العميل",
    phone: "الهاتف",
    total: "الإجمالي",
    platform: "المنصة",
    edited: "تم التعديل · بانتظار التأكيد",
    editing: "العميل يعدل الطلب",
    awaitingEdit: "بانتظار تعديل العميل",
    editStatus: "حالة التعديل",
    lastEdited: "آخر تعديل",
    placed: "تاريخ الطلب",
    details: "تفاصيل الطلب",
    close: "إغلاق",
    items: "الأصناف",
    quantity: "الكمية",
    price: "السعر",
    resend: "إعادة إرسال التأكيد",
    resending: "جاري الإرسال…",
    resent: "تم إرسال رسالة التأكيد.",
    resendError: "تعذرت إعادة إرسال رسالة التأكيد.",
    detailError: "تعذر تحميل تفاصيل الطلب.",
    editSnapshot: "الأصناف قبل التعديل",
    noItems: "لا تتوفر تفاصيل للأصناف.",
    previous: "السابق",
    next: "التالي",
    page: (current, total) => `صفحة ${current} من ${total}`,
    noCustomer: "العميل",
  },
};

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  editing: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  edited: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
};

function listPayload(response) {
  const result = response?.data ?? response ?? {};
  if (Array.isArray(result)) return { orders: result, pagination: {} };

  const nested = result?.data;
  if (Array.isArray(nested)) {
    return { orders: nested, pagination: result };
  }
  if (Array.isArray(nested?.data)) {
    return { orders: nested.data, pagination: nested };
  }
  if (nested && typeof nested === "object" && nested.id !== undefined) {
    return { orders: [nested], pagination: { current_page: 1, last_page: 1, total: 1 } };
  }
  if (result && typeof result === "object" && result.id !== undefined) {
    return { orders: [result], pagination: { current_page: 1, last_page: 1, total: 1 } };
  }

  const paginated = nested ?? {};
  return {
    orders: Array.isArray(paginated) ? paginated : paginated.data ?? [],
    pagination: Array.isArray(paginated) ? {} : paginated,
  };
}

function orderState(order, t) {
  const status = String(order.status ?? "pending").toLowerCase();
  if (status === "confirmed" || status === "cancelled") return { label: t[status], style: STATUS_STYLES[status] };
  if (order.edit_state === "edited") return { label: t.edited, style: STATUS_STYLES.edited };
  if (order.edit_state === "editing") return { label: t.editing, style: STATUS_STYLES.editing };
  if (order.edit_state === "awaiting_edit") return { label: t.awaitingEdit, style: STATUS_STYLES.editing };
  return { label: t.pending, style: STATUS_STYLES.pending };
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function OrderDetails({ order, t, locale }) {
  const items = order?.edit_items_snapshot ?? order?.items ?? order?.raw_payload?.items ?? [];
  const edit = orderState(order, t);
  return (
    <div className="space-y-5">
      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          [t.order, order.order_number ?? order.external_order_id ?? order.id],
          [t.customer, order.customer_name || t.noCustomer],
          [t.phone, order.customer_phone],
          [t.platform, order.platform],
          [t.total, order.total_price == null ? "—" : `${order.total_price} ${order.currency ?? ""}`],
          [t.status, order.status],
          [t.editStatus, edit.label],
          [t.placed, formatDate(order.created_at, locale)],
          [t.lastEdited, formatDate(order.edited_at, locale)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 border-b border-[var(--border)] pb-2">
            <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="mb-2 text-sm font-semibold">{order.edit_items_snapshot ? t.editSnapshot : t.items}</h3>
        {!items.length ? <p className="text-sm text-[var(--muted-foreground)]">{t.noItems}</p> : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <article key={`${item.index ?? item.id ?? index}`} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium">{item.name || item.title || `#${item.index ?? index + 1}`}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{t.quantity}: {item.quantity ?? "—"}</p>
                </div>
                {item.price != null && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t.price}: {item.price}</p>}
                {item.attributes && <pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--muted-foreground)]">{JSON.stringify(item.attributes, null, 2)}</pre>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function EcommerceOrdersPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const locale = lang === "ar" ? "ar" : "en";
  const [filters, setFilters] = useState({ search: "", status: "", whats_item_id: "" });
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "", whats_item_id: "" });
  const [query, setQuery] = useState({ page: 1, per_page: 15 });
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.USER.ECOMMERCE_ORDERS, { ...query, ...appliedFilters });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const dialogRef = useRef(null);
  const { orders, pagination } = listPayload(data);
  const currentPage = Number(pagination.current_page ?? query.page);
  const lastPage = Number(pagination.last_page ?? Math.max(1, Math.ceil(Number(pagination.total ?? 0) / query.per_page)));
  const total = Number(pagination.total ?? orders.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedId && !dialog.open) dialog.showModal();
    else if (!selectedId && dialog.open) dialog.close();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return undefined;
    }
    let current = true;
    getEcommerceOrder(selectedId)
      .then((response) => {
        if (current) setSelectedOrder(response.data?.data ?? response.data);
      })
      .catch((requestError) => {
        console.error("Could not load ecommerce order details:", requestError);
        toast.error(requestError.response?.data?.message || t.detailError);
        if (current) setSelectedId(null);
      })
      .finally(() => {
        if (current) setDetailsLoading(false);
      });
    return () => { current = false; };
  }, [selectedId, t.detailError]);

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
    setQuery((current) => ({ ...current, page: 1 }));
  };

  const resend = async (order) => {
    setResendingId(order.id);
    try {
      const response = await resendEcommerceOrderConfirmation(order.id);
      if (response.data?.status === false || response.data?.data?.success === false) {
        throw new Error(response.data?.message || response.data?.data?.message || t.resendError);
      }
      toast.success(response.data?.message || response.data?.data?.message || t.resent);
    } catch (requestError) {
      console.error("Could not resend ecommerce order confirmation:", requestError);
      toast.error(requestError.response?.data?.message || requestError.message || t.resendError);
    } finally {
      setResendingId(null);
    }
  };

  const openDetails = (orderId) => {
    setSelectedOrder(null);
    setDetailsLoading(true);
    setSelectedId(orderId);
  };

  const closeDetails = () => {
    setSelectedId(null);
    setSelectedOrder(null);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <header>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
      </header>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block sm:col-span-2">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder={t.search} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] ps-9 pe-3 text-sm outline-none focus:border-[var(--primary)]" />
        </label>
        <label className="sr-only" htmlFor="ecommerce-order-status">{t.status}</label>
        <select id="ecommerce-order-status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm">
          <option value="">{t.allStatuses}</option>
          <option value="pending">{t.pending}</option>
          <option value="confirmed">{t.confirmed}</option>
          <option value="cancelled">{t.cancelled}</option>
        </select>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="ecommerce-whats-item">{t.channel}</label>
          <input id="ecommerce-whats-item" type="number" min="1" value={filters.whats_item_id}
            onChange={(event) => setFilters({ ...filters, whats_item_id: event.target.value })}
            placeholder={t.channel} className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
            <Search className="h-4 w-4" aria-hidden="true" />{t.apply}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? <div className="grid min-h-48 place-items-center"><Loader text={t.loading} /></div>
          : error ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-5">
            <p role="alert" className="text-sm text-[var(--destructive)]">{error || t.failed}</p>
            <button type="button" onClick={refetch} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">{t.apply}</button>
          </div>
            : !orders.length ? <EmptyState title={t.empty} />
              : <div className="divide-y divide-[var(--border)]">
                {orders.map((order) => {
                  const state = orderState(order, t);
                  return (
                    <article key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold">{t.order} #{order.order_number ?? order.external_order_id ?? order.id}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state.style}`}>{state.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{order.customer_name || t.noCustomer} · {order.customer_phone || "—"}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{order.platform || "—"} · {formatDate(order.created_at, locale)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="me-2 text-sm font-semibold">{order.total_price ?? "—"} {order.currency ?? ""}</span>
                        <button type="button" onClick={() => openDetails(order.id)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm hover:bg-[var(--muted)]">
                          <Eye className="h-4 w-4" aria-hidden="true" />{t.details}
                        </button>
                        <button type="button" onClick={() => resend(order)} disabled={resendingId === order.id}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm hover:bg-[var(--muted)] disabled:opacity-50">
                          <RefreshCw className={`h-4 w-4 ${resendingId === order.id ? "animate-spin" : ""}`} aria-hidden="true" />
                          {resendingId === order.id ? t.resending : t.resend}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>}
        {!loading && !error && total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
            <span className="text-sm text-[var(--muted-foreground)]">{t.page(currentPage, lastPage)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={currentPage <= 1} onClick={() => setQuery({ ...query, page: currentPage - 1 })}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 text-sm disabled:opacity-50">
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}{t.previous}
              </button>
              <button type="button" disabled={currentPage >= lastPage} onClick={() => setQuery({ ...query, page: currentPage + 1 })}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 text-sm disabled:opacity-50">
                {t.next}{isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </footer>
        )}
      </section>

      <dialog ref={dialogRef} onClose={closeDetails} aria-labelledby="ecommerce-order-details-title"
        dir={isRTL ? "rtl" : "ltr"}
        className="w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/50">
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5">
            <h2 id="ecommerce-order-details-title" className="text-lg font-semibold">{t.details}</h2>
            <button type="button" onClick={closeDetails} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">{t.close}</button>
          </header>
          <div className="overflow-y-auto p-5">
            {detailsLoading || !selectedOrder ? <Loader text={t.loading} /> : <OrderDetails order={selectedOrder} t={t} locale={locale} />}
          </div>
        </div>
      </dialog>
    </main>
  );
}
