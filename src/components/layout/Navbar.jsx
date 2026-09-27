import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronDown, User, Sun, Moon, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePost } from "../../hooks/usePost";
import { logout } from "../../redux/slices/authSlice";
import { setLang, toggleTheme } from "../../redux/slices/uiSlice";
import { API_ENDPOINTS } from "../../utils/constants";

// Pages where the back button should appear + their target
const BACK_ROUTES = {
  "/order":   "/dashboard",
  "/profile": "/dashboard",
  "/whatsapp": "/dashboard",
};

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector((s) => s.auth.user);
  const lang      = useSelector((s) => s.ui.lang);
  const theme     = useSelector((s) => s.ui.theme);
  const { execute, loading } = usePost();

  const [menuOpen, setMenuOpen] = useState(false);

  const isRTL      = lang === "ar";
  const isDark     = theme === "dark";
  const backTarget = BACK_ROUTES[location.pathname];

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setMenuOpen(false);
    const result = await execute(API_ENDPOINTS.AUTH.LOGOUT, {});
    toast[result.success ? "success" : "info"](
      result.success ? "Logged out successfully." : "Session ended."
    );
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* ── Left side: Back button (if applicable) + Brand ── */}
        <div className="flex items-center gap-2">
          {/* Back button */}
          <AnimatePresence>
            {backTarget && (
              <motion.button
                key="back"
                type="button"
                onClick={() => navigate(backTarget)}
                initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 8 : -8 }}
                transition={{ duration: 0.2 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center
                  text-[var(--muted-foreground)] hover:text-[var(--foreground)]
                  hover:bg-[var(--muted)] transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                aria-label="Go back"
              >
                <BackIcon className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-lg"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--primary)" }}
            >
              <span className="text-white text-xs font-bold select-none">S</span>
            </div>
            <span className="font-semibold text-sm text-[var(--foreground)] tracking-tight hidden sm:block">
              SmartEgo
            </span>
          </button>
        </div>

        {/* ── Right side: Lang + Theme + User menu ── */}
        <div className="flex items-center gap-1.5">

          {/* ── Language toggle ── */}
          <div className="flex items-center bg-[var(--muted)] rounded-xl p-0.5 gap-0.5">
            {["en", "ar"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => dispatch(setLang(l))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                  ${lang === l
                    ? "bg-white dark:bg-[var(--card)] text-[var(--primary)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                aria-pressed={lang === l}
                aria-label={`Switch to ${l === "en" ? "English" : "Arabic"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Theme toggle ── */}
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="w-8 h-8 rounded-xl flex items-center justify-center
              text-[var(--muted-foreground)] hover:text-[var(--foreground)]
              hover:bg-[var(--muted)] transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {isDark
                  ? <Sun  className="w-4 h-4" aria-hidden="true" />
                  : <Moon className="w-4 h-4" aria-hidden="true" />
                }
              </motion.span>
            </AnimatePresence>
          </button>

          {/* ── User menu ── */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5
                hover:bg-[var(--muted)] transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {initials}
              </div>
              <span className="text-sm font-medium text-[var(--foreground)] hidden sm:block max-w-[120px] truncate">
                {user?.name ?? "User"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />

                  <motion.div
                    key="dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute end-0 top-full mt-2 w-56 z-20 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                        {user?.email ?? user?.phone ?? "—"}
                      </p>
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)]
                          rounded-xl hover:bg-[var(--muted)] transition-colors duration-100"
                      >
                        <User className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                        {lang === "ar" ? "الملف الشخصي" : "Profile"}
                      </button>
                    </div>

                    <div className="p-1 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500
                          rounded-xl hover:bg-red-500/10 transition-colors duration-100
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        {loading
                          ? (lang === "ar" ? "جاري الخروج…" : "Logging out…")
                          : (lang === "ar" ? "تسجيل الخروج" : "Log out")
                        }
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
