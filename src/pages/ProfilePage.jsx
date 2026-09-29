import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { User, Mail, Phone, Store, Shield, Hash, RefreshCw } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import Navbar     from "../components/layout/Navbar";
import Loader     from "../components/common/Loader";
import Badge      from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { localizeApiLabel } from "../utils/localization";

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    name:       "Full Name",
    email:      "Email",
    phone:      "Phone",
    restaurant: "Restaurant",
    role:       "Role",
    userId:     "User ID",
    notSet:     "Not set",
    loading:    "Loading profile…",
    errorTitle: "Failed to load profile",
    retry:      "Try again",
    info:       "Account Information",
  },
  ar: {
    name:       "الاسم الكامل",
    email:      "البريد الإلكتروني",
    phone:      "الهاتف",
    restaurant: "المطعم",
    role:       "الدور",
    userId:     "المعرّف",
    notSet:     "غير محدد",
    loading:    "جاري التحميل…",
    errorTitle: "فشل تحميل البيانات",
    retry:      "حاول مرة أخرى",
    info:       "معلومات الحساب",
  },
};

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-0 gap-4">
      <div className="flex items-center gap-2.5 shrink-0">
        <Icon className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
        <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      </div>
      <span className={`text-sm font-medium text-[var(--foreground)] text-end truncate ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const lang       = useSelector((s) => s.ui.lang);
  const t          = T[lang] ?? T.en;
  const cachedUser = useSelector((s) => s.auth.user);

  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.USER.PROFILE);
  const u = data ?? cachedUser;

  if (loading && !u) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <Loader fullScreen text={t.loading} />
      </div>
    );
  }

  if (error && !u) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState icon={User} title={t.errorTitle} description={error}
            action={
              <button type="button" onClick={refetch}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[var(--primary-foreground)]"
                style={{ background: "var(--primary)" }}>
                <RefreshCw className="w-3.5 h-3.5" />{t.retry}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const initials   = u?.name ? u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "U";
  const restaurant = u?.restuarant_name ?? u?.restaurant_name;

  return (
    <div className="min-h-screen bg-[var(--background)]"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.88 0.12 138 / 18%), transparent)" }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-10 space-y-5">

        {/* ── Avatar + name ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3 pt-2 pb-2"
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--primary)]/20"
              style={{ background: "var(--primary)" }}
            >
              {initials}
            </div>
            <span className="absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[var(--background)]" />
          </div>

          {/* Name + restaurant */}
          <div className="text-center">
            <h1 className="text-lg font-bold text-[var(--foreground)]">{u?.name ?? "—"}</h1>
            {restaurant && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{restaurant}</p>
            )}
            <div className="mt-1.5">
              <Badge variant="default" className="capitalize">{localizeApiLabel(u?.role, lang)}</Badge>
            </div>
          </div>
        </motion.div>

        {/* ── Info card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
              {t.info}
            </p>
          </div>
          <div className="px-5">
            <Row icon={Hash}   label={t.userId}     value={u?.id}                    mono />
            <Row icon={User}   label={t.name}       value={u?.name}                       />
            <Row icon={Mail}   label={t.email}      value={u?.email   ?? t.notSet}        />
            <Row icon={Phone}  label={t.phone}      value={u?.phone   ?? t.notSet}        />
            <Row icon={Store}  label={t.restaurant} value={restaurant ?? t.notSet}        />
            <Row icon={Shield} label={t.role}       value={
              <Badge variant="default" className="capitalize">{localizeApiLabel(u?.role, lang)}</Badge>
            } />
          </div>
        </motion.div>

      </main>
    </div>
  );
}
