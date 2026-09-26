import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { usePost } from "../hooks/usePost";
import { setAuth, saveAuthToStorage } from "../redux/slices/authSlice";
import { setLang, toggleTheme } from "../redux/slices/uiSlice";
import { API_ENDPOINTS } from "../utils/constants";
import { initFacebookSDK, loginWithFacebook } from "../utils/facebookAuth";

// ─── Dev token ────────────────────────────────────────────────────────────────
const FB_DEV_TOKEN = import.meta.env.VITE_FB_DEV_TOKEN;

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    tagline:   "Sign in to continue",
    btnIdle:   "Continue with Facebook",
    btnFb:     "Opening Facebook…",
    btnApi:    "Signing you in…",
    agree:     "By continuing you agree to our",
    terms:     "Terms of Service",
    privacy:   "Privacy Policy",
    and:       "and",
    copyright: `© ${new Date().getFullYear()} SmartEgo. All rights reserved.`,
  },
  ar: {
    tagline:   "سجّل دخولك للمتابعة",
    btnIdle:   "المتابعة بواسطة فيسبوك",
    btnFb:     "جاري فتح فيسبوك…",
    btnApi:    "جاري تسجيل الدخول…",
    agree:     "بالمتابعة أنت توافق على",
    terms:     "شروط الاستخدام",
    privacy:   "سياسة الخصوصية",
    and:       "و",
    copyright: `© ${new Date().getFullYear()} SmartEgo. جميع الحقوق محفوظة.`,
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
    className="w-5 h-5" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const lang      = useSelector((s) => s.ui.lang);
  const theme     = useSelector((s) => s.ui.theme);
  const t         = T[lang] ?? T.en;
  const isDark    = theme === "dark";

  const { execute, loading } = usePost();
  const [error, setError]    = useState(null);
  const [step, setStep]      = useState("idle");

  const isLoading = loading || step !== "idle";

  const loginWithToken = async (accessToken) => {
    setStep("api");
    const result = await execute(API_ENDPOINTS.AUTH.FACEBOOK, { access_token: accessToken });
    setStep("idle");

    if (result.success) {
      const data = result.data?.data ?? result.data ?? {};
      saveAuthToStorage(data);
      dispatch(setAuth(data));
      toast.success(lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
      navigate("/dashboard", { replace: true });
    } else {
      const msg = result.error || (lang === "ar" ? "فشل تسجيل الدخول. حاول مرة أخرى." : "Login failed. Please try again.");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    if (FB_DEV_TOKEN) {
      await loginWithToken(FB_DEV_TOKEN);
    } else {
      try {
        setStep("fb");
        await initFacebookSDK();
        const accessToken = await loginWithFacebook();
        await loginWithToken(accessToken);
      } catch (err) {
        setStep("idle");
        const msg = err.message || (lang === "ar" ? "تم إلغاء تسجيل الدخول." : "Facebook login was cancelled.");
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const btnLabel = step === "fb" ? t.btnFb : step === "api" ? t.btnApi : t.btnIdle;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 55% at 50% -5%, oklch(0.88 0.12 138 / 25%), transparent)" }}>

      {/* ── Top-right controls ── */}
      <div className="absolute top-4 end-4 flex items-center gap-1.5">
        {/* Language */}
        <div className="flex items-center bg-[var(--muted)] rounded-xl p-0.5 gap-0.5">
          {["en", "ar"].map((l) => (
            <button key={l} type="button" onClick={() => dispatch(setLang(l))}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                ${lang === l
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
              aria-pressed={lang === l}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme */}
        <button type="button" onClick={() => dispatch(toggleTheme())}
          className="w-8 h-8 rounded-xl flex items-center justify-center
            text-[var(--muted-foreground)] hover:text-[var(--foreground)]
            hover:bg-[var(--muted)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label={isDark ? "Switch to light" : "Switch to dark"}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={isDark ? "sun" : "moon"}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="relative bg-[var(--card)] rounded-3xl shadow-2xl shadow-[var(--primary)]/10 border border-[var(--border)] overflow-hidden">
          {/* Top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.68_0.17_138)] via-[oklch(0.78_0.18_100)] to-[oklch(0.68_0.17_138)]" />

          <div className="px-8 pt-10 pb-10">
            {/* Brand */}
            <div className="flex flex-col items-center gap-3 mb-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/25"
                style={{ background: "var(--primary)" }}>
                <span className="text-white text-2xl font-bold select-none">S</span>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">SmartEgo</h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{t.tagline}</p>
              </div>
            </div>

            {/* Facebook button */}
            <button type="button" onClick={handleFacebookLogin}
              disabled={isLoading} aria-busy={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5
                rounded-2xl text-sm font-semibold bg-[#1877F2] text-white
                hover:bg-[#166FE5] active:scale-[0.98] transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#1877F2]/20">
              {isLoading ? <><SpinnerIcon />{btnLabel}</> : <><FacebookIcon />{btnLabel}</>}
            </button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div key="error" role="alert"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--card)] px-3 text-xs text-[var(--muted-foreground)]">
                  {t.agree}
                </span>
              </div>
            </div>

            {/* Legal */}
            <p className="text-center text-xs text-[var(--muted-foreground)] leading-relaxed">
              <a href="#" className="font-medium text-[var(--primary)] hover:underline underline-offset-2">{t.terms}</a>
              {" "}{t.and}{" "}
              <a href="#" className="font-medium text-[var(--primary)] hover:underline underline-offset-2">{t.privacy}</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">{t.copyright}</p>
      </motion.div>
    </div>
  );
}
