import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  Infinity,
  CalendarDays,
  Store,
  Phone,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import Navbar from "../components/layout/Navbar";
import Loader from "../components/common/Loader";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso, locale = "en-GB") =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" }) : null;

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    welcome:        (name) => `Welcome back, ${name} 👋`,
    managing:       (r)    => `Managing · ${r}`,
    overview:       "Here's your Messenger auto-reply overview",
    newSub:         "New Subscription",
    filterDate:     "Filter by date",
    filtered:       (f, t) => `Filtered: ${f} → ${t}`,
    from:           "From",
    to:             "To",
    clear:          "Clear",
    apply:          "Apply",
    activeOrders:   "Active Orders",
    pending:        "Pending approval",
    used:           "Messages Used",
    thisPeriod:     "This period",
    remaining:      "Remaining",
    msgLeft:        "messages left",
    unlimited:      "Unlimited plan",
    periodEnd:      "Period End",
    noPeriod:       "No active period",
    fromDate:       (d)    => `From ${d}`,
    restaurant:     "Restaurant Overview",
    name:           "Name",
    phone:          "Phone",
    waStatus:       "WhatsApp Status",
    notConnected:   "Not connected",
    account:        "Account Info",
    email:          "Email",
    notSet:         "Not set",
    role:           "Role",
    tryAgain:       "Try again",
    loading:        "Loading dashboard…",
  },
  ar: {
    welcome:        (name) => `أهلاً بك، ${name} 👋`,
    managing:       (r)    => `إدارة · ${r}`,
    overview:       "نظرة عامة على نظام الرد التلقائي",
    newSub:         "اشتراك جديد",
    filterDate:     "تصفية بالتاريخ",
    filtered:       (f, t) => `مُصفَّى: ${f} → ${t}`,
    from:           "من",
    to:             "إلى",
    clear:          "مسح",
    apply:          "تطبيق",
    activeOrders:   "الطلبات النشطة",
    pending:        "بانتظار الموافقة",
    used:           "الرسائل المستخدمة",
    thisPeriod:     "هذه الفترة",
    remaining:      "المتبقي",
    msgLeft:        "رسالة متبقية",
    unlimited:      "باقة غير محدودة",
    periodEnd:      "نهاية الفترة",
    noPeriod:       "لا توجد فترة نشطة",
    fromDate:       (d)    => `من ${d}`,
    restaurant:     "نظرة عامة على المطعم",
    name:           "الاسم",
    phone:          "الهاتف",
    waStatus:       "حالة واتساب",
    notConnected:   "غير متصل",
    account:        "معلومات الحساب",
    email:          "البريد الإلكتروني",
    notSet:         "غير محدد",
    role:           "الدور",
    tryAgain:       "حاول مرة أخرى",
    loading:        "جاري التحميل…",
  },
};

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <motion.div {...fadeUp(delay)} className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg" style={{ background: gradient }}>
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon className="w-4.5 h-4.5 text-white" aria-hidden="true" />
        </div>
        <p className="text-xs font-medium text-white/70 mb-1">{label}</p>
        <p className="text-2xl font-bold leading-none">{value ?? "—"}</p>
        {sub && <p className="text-xs text-white/60 mt-1.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{children ?? "—"}</span>
    </div>
  );
}

// ─── Date Filter ─────────────────────────────────────────────────────────────

function DateFilter({ from, to, onChange, onReset, onApply, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-4 mt-2">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="filter-from" className="block text-xs font-medium text-[var(--muted-foreground)]">
              {t.from}
            </label>
            <input id="filter-from" type="date" value={from}
              onChange={(e) => onChange("from", e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)]
                px-3 py-2 text-sm text-[var(--foreground)]
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-colors" />
          </div>
          <div className="flex-1 space-y-1">
            <label htmlFor="filter-to" className="block text-xs font-medium text-[var(--muted-foreground)]">
              {t.to}
            </label>
            <input id="filter-to" type="date" value={to}
              onChange={(e) => onChange("to", e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)]
                px-3 py-2 text-sm text-[var(--foreground)]
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-colors" />
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                text-[var(--muted-foreground)] border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <X className="w-3.5 h-3.5" aria-hidden="true" /> {t.clear}
            </button>
            <button type="button" onClick={onApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--primary-foreground)] transition-colors"
              style={{ background: "var(--primary)" }}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> {t.apply}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user     = useSelector((s) => s.auth.user);
  const lang     = useSelector((s) => s.ui.lang);
  const navigate = useNavigate();
  const t        = T[lang] ?? T.en;
  const locale   = lang === "ar" ? "ar-EG" : "en-GB";

  // Date filter state (staged: user edits these, then clicks Apply)
  const [draft, setDraft]       = useState({ from: "", to: "" });
  // Applied params (sent to API)
  const [params, setParams]     = useState({});
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, loading, error, refetch } = useGet(
    API_ENDPOINTS.USER.DASHBOARD,
    params
  );

  const d = data?.data;
  const phoneStatus   = d?.overview?.phone_status;
  const isPhoneActive = phoneStatus?.toLowerCase() === "active";

  const handleDraftChange = (key, val) => setDraft((p) => ({ ...p, [key]: val }));

  const applyFilter = () => {
    const next = {};
    if (draft.from) next.from = draft.from;
    if (draft.to)   next.to   = draft.to;
    setParams(next);
  };

  const resetFilter = () => {
    setDraft({ from: "", to: "" });
    setParams({});
  };

  const hasActiveFilter = params.from || params.to;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <Loader fullScreen text={t.loading} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <p className="text-sm text-[var(--destructive)]">{error}</p>
          <button type="button" onClick={refetch} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--primary)" }}>
            {t.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]" style={{ backgroundImage: "radial-gradient(ellipse 100% 40% at 50% 0%, oklch(0.88 0.12 138 / 15%), transparent)" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Welcome header ── */}
        <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
              {t.welcome(user?.name ?? "User")}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {d?.overview?.restaurant_name ? t.managing(d.overview.restaurant_name) : t.overview}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => navigate("/order")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all duration-150 active:scale-95"
              style={{ background: "var(--primary)" }}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t.newSub}
            </button>
            <button type="button" onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150
                ${hasActiveFilter
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              {hasActiveFilter ? t.filtered(fmt(params.from, locale) ?? "—", fmt(params.to, locale) ?? "—") : t.filterDate}
            </button>
          </div>
        </motion.div>

        {/* ── Date filter panel ── */}
        {filterOpen && (
          <DateFilter from={draft.from} to={draft.to} onChange={handleDraftChange} onReset={resetFilter} onApply={applyFilter} t={t} />
        )}

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={MessageSquare} label={t.activeOrders} value={d?.active_order ?? 0} sub={t.pending}
            gradient="linear-gradient(135deg, oklch(0.65 0.18 138), oklch(0.75 0.17 100))" delay={0.05} />
          <StatCard icon={TrendingUp} label={t.used} value={d?.used ?? 0} sub={t.thisPeriod}
            gradient="linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.68 0.17 250))" delay={0.1} />
          <StatCard icon={Infinity} label={t.remaining} value={d?.remaining ?? "∞"}
            sub={d?.remaining ? t.msgLeft : t.unlimited}
            gradient="linear-gradient(135deg, oklch(0.60 0.18 55), oklch(0.70 0.17 30))" delay={0.15} />
          <StatCard icon={CalendarDays} label={t.periodEnd} value={fmt(d?.period?.to, locale) ?? "—"}
            sub={d?.period?.from ? t.fromDate(fmt(d.period.from, locale)) : t.noPeriod}
            gradient="linear-gradient(135deg, oklch(0.58 0.18 300), oklch(0.68 0.17 270))" delay={0.2} />
        </div>

        {/* ── Bottom cards ── */}
        <div className="grid md:grid-cols-2 gap-4">

          <motion.div {...fadeUp(0.25)} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.95 0.04 138)" }}>
                <Store className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.restaurant}</h2>
            </div>
            <div className="px-5">
              <InfoRow label={t.name}>{d?.overview?.restaurant_name}</InfoRow>
              <InfoRow label={t.phone}>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-hidden="true" />
                  {d?.overview?.phone ?? "—"}
                </span>
              </InfoRow>
              <InfoRow label={t.waStatus}>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isPhoneActive ? "bg-green-100 text-green-700" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                  {isPhoneActive ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <XCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                  {phoneStatus ?? t.notConnected}
                </span>
              </InfoRow>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.3)} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.95 0.04 220)" }}>
                <Store className="w-3.5 h-3.5 text-[oklch(0.55_0.18_220)]" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.account}</h2>
            </div>
            <div className="px-5">
              <InfoRow label={t.name}>{user?.name}</InfoRow>
              <InfoRow label={t.email}>{user?.email ?? t.notSet}</InfoRow>
              <InfoRow label={t.phone}>{user?.phone}</InfoRow>
              <InfoRow label={t.role}>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)] text-[var(--primary)] capitalize">
                  {user?.role ?? "—"}
                </span>
              </InfoRow>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
