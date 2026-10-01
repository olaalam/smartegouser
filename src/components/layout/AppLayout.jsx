import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, ChevronLeft, ChevronRight, ClipboardList, CreditCard, LayoutDashboard, Link2 } from "lucide-react";
import Navbar from "./Navbar";

function FacebookMark() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0866ff]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="white">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    </span>
  );
}

const navigation = [
  { to: "/dashboard", label: { en: "Dashboard", ar: "لوحة التحكم" }, icon: LayoutDashboard },
  { to: "/connect", label: { en: "Connect accounts", ar: "ربط الحسابات" }, icon: Link2 },
  { to: "/user-orders", label: { en: "User Orders", ar: "طلبات المستخدم" }, icon: ClipboardList },
];

export default function AppLayout({ children }) {
  const lang = useSelector((state) => state.ui.lang);
  const location = useLocation();
  const isRTL = lang === "ar";
  const [isExpanded, setIsExpanded] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const ToggleIcon = isExpanded
    ? (isRTL ? ChevronRight : ChevronLeft)
    : (isRTL ? ChevronLeft : ChevronRight);
  const toggleLabel = isExpanded
    ? (isRTL ? "إغلاق القائمة الجانبية" : "Collapse sidebar")
    : (isRTL ? "فتح القائمة الجانبية" : "Expand sidebar");

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {isExpanded && (
        <button
          type="button"
          aria-label={isRTL ? "إغلاق القائمة الجانبية" : "Close sidebar"}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      <aside className={`sticky top-0 z-50 flex h-screen shrink-0 flex-col border-e border-[var(--border)] bg-[var(--card)] py-4 transition-[width] duration-200 ${isExpanded ? "w-56 px-3 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:shadow-xl" : "w-14 px-2"}`}>
        <div className={`mb-6 flex items-center gap-2 ${isExpanded ? "justify-between" : "flex-col"}`}>
          <div className="flex h-9 min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "var(--primary)" }}>S</span>
            {isExpanded && <span className="truncate text-sm font-semibold text-[var(--foreground)]">SmartEgo</span>}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ToggleIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={isRTL ? "التنقل الرئيسي" : "Main navigation"} className="space-y-1">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = to === "/fb-pages"
              ? location.pathname.startsWith(to)
              : location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                title={label[lang] ?? label.en}
                className={`flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${active
                  ? "bg-[var(--accent)] font-semibold text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {isExpanded && <span className="truncate">{label[lang] ?? label.en}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Navbar />
        {children}
      </div>
    </div>
  );
}