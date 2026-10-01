import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  Lock,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { usePost } from "../hooks/usePost";
import { setAuth, saveAuthToStorage } from "../redux/slices/authSlice";
import { API_ENDPOINTS } from "../utils/constants";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    tagline: "Welcome to SmartEgo",
    tabLogin: "Log In",
    tabSignup: "Sign Up",
    nameLabel: "Full Name",
    namePlaceholder: "John Doe",
    emailLabel: "Email Address",
    emailPlaceholder: "user@example.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "01xxxxxxxxx",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    btnLogin: "Sign In",
    btnSignup: "Create Account",
    agree: "By continuing you agree to our",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    and: "and",
    copyright: `© ${new Date().getFullYear()} SmartEgo. All rights reserved.`,

    // Verification & Forgot Password
    forgotPassword: "Forgot Password?",
    backToLogin: "Back to Login",
    verifyAccountTitle: "Verify Your Account",
    verifyAccountDesc: "Please enter the code sent to your email.",
    codeLabel: "Verification Code",
    codePlaceholder: "123456",
    btnVerify: "Verify Account",
    forgotPassTitle: "Reset Password",
    forgotPassDesc: "Enter your email to receive a reset code.",
    btnSendCode: "Send Code",
    checkCodeTitle: "Enter Reset Code",
    checkCodeDesc: "Please enter the reset code sent to your email.",
    btnCheckCode: "Verify Code",
    changePassTitle: "New Password",
    changePassDesc: "Enter your new password.",
    btnChangePass: "Change Password",
    newPasswordLabel: "New Password",
    blockedMsg: "Too many failed attempts. Try again in 5 minutes.",
  },
  ar: {
    tagline: "أهلاً بك في SmartEgo",
    tabLogin: "تسجيل الدخول",
    tabSignup: "حساب جديد",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "أحمد محمد",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "user@example.com",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "01xxxxxxxxx",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "••••••••",
    btnLogin: "دخول",
    btnSignup: "إنشاء حساب",
    agree: "بالمتابعة أنت توافق على",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    and: "و",
    copyright: `© ${new Date().getFullYear()} SmartEgo. جميع الحقوق محفوظة.`,

    // Verification & Forgot Password
    forgotPassword: "نسيت كلمة المرور؟",
    backToLogin: "العودة لتسجيل الدخول",
    verifyAccountTitle: "تفعيل الحساب",
    verifyAccountDesc: "يرجى إدخال الكود المرسل إلى بريدك الإلكتروني.",
    codeLabel: "كود التفعيل",
    codePlaceholder: "123456",
    btnVerify: "تفعيل الحساب",
    forgotPassTitle: "استعادة كلمة المرور",
    forgotPassDesc: "أدخل بريدك الإلكتروني لاستلام كود الاستعادة.",
    btnSendCode: "إرسال الكود",
    checkCodeTitle: "أدخل كود الاستعادة",
    checkCodeDesc: "يرجى إدخال الكود المرسل إلى بريدك الإلكتروني.",
    btnCheckCode: "تحقق من الكود",
    changePassTitle: "كلمة مرور جديدة",
    changePassDesc: "أدخل كلمة المرور الجديدة الخاصة بك.",
    btnChangePass: "تغيير كلمة المرور",
    newPasswordLabel: "كلمة المرور الجديدة",
    blockedMsg: "محاولات خاطئة كثيرة. حاول مرة أخرى بعد 5 دقائق.",
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = useSelector((s) => s.ui.lang);
  const t = T[lang] ?? T.en;

  const { execute, loading } = usePost();

  const [view, setView] = useState("auth");
  const [activeTab, setActiveTab] = useState("login"); 

  const [error, setError] = useState(null);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", phone: "" });
  const [verifyData, setVerifyData] = useState({ email: "", code: "" });
  const [forgotPassEmail, setForgotPassEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState(null);

  const isLoading = loading;

  useEffect(() => {
    let interval;
    if (isBlocked && blockEndTime) {
      interval = setInterval(() => {
        if (Date.now() >= blockEndTime) {
          setIsBlocked(false);
          setFailedCodeAttempts(0);
          setBlockEndTime(null);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockEndTime]);

  const handleAuthSuccess = (data) => {
    saveAuthToStorage(data);
    dispatch(setAuth(data));
    toast.success(lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
    navigate("/dashboard", { replace: true });
  };

  const resetErrors = () => setError(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const loginEndpoint = API_ENDPOINTS?.AUTH?.LOGIN || "/auth/user/login";
    const result = await execute(loginEndpoint, loginData);

    if (result.success) {
      const data = result.data?.data ?? result.data ?? {};
      handleAuthSuccess(data);
    } else {
      const msg = result.error || (lang === "ar" ? "فشل تسجيل الدخول." : "Login failed.");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const signupEndpoint = API_ENDPOINTS?.AUTH?.SIGNUP || "/auth/signup";
    const result = await execute(signupEndpoint, signupData);

    if (result.success) {
      setVerifyData({ ...verifyData, email: signupData.email });
      setView("verify_account");
      toast.success(lang === "ar" ? "تم إنشاء الحساب، يرجى تفعيله." : "Account created, please verify.");
    } else {
      const msg = result.error || (lang === "ar" ? "فشل إنشاء الحساب." : "Signup failed.");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleVerifyAccountSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const verifyEndpoint = "/auth/active_account"; 
    const result = await execute(verifyEndpoint, verifyData);

    if (result.success) {
      toast.success(lang === "ar" ? "تم تفعيل الحساب بنجاح! يمكنك الآن تسجيل الدخول." : "Account verified successfully! You can now log in.");
      setView("auth");
      setActiveTab("login");
    } else {
      const msg = result.error || (lang === "ar" ? "كود غير صالح." : "Invalid code.");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleForgotPassSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const result = await execute("/auth/forget_password", { email: forgotPassEmail });

    if (result.success) {
      toast.success(lang === "ar" ? "تم إرسال كود الاستعادة." : "Reset code sent.");
      setView("check_code");
    } else {
      const msg = result.error || (lang === "ar" ? "فشل إرسال الكود." : "Failed to send code.");
      setError(msg);
      toast.error(msg);
    }
  };

  const handleCheckCodeSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      toast.error(t.blockedMsg);
      return;
    }
    resetErrors();

    const result = await execute("/auth/check_code", { email: forgotPassEmail, code: resetCode });

    if (result.success) {
      toast.success(lang === "ar" ? "الكود صحيح." : "Code verified.");
      setView("change_password");
      setFailedCodeAttempts(0);
    } else {
      const newAttempts = failedCodeAttempts + 1;
      setFailedCodeAttempts(newAttempts);
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setBlockEndTime(Date.now() + 5 * 60 * 1000); 
        toast.error(t.blockedMsg);
      } else {
        const msg = result.error || (lang === "ar" ? "كود غير صالح." : "Invalid code.");
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const payload = { email: forgotPassEmail, code: resetCode, password: newPassword };
    const result = await execute("/auth/change_password", payload);

    if (result.success) {
      toast.success(lang === "ar" ? "تم تغيير كلمة المرور بنجاح!" : "Password changed successfully!");
      setView("auth");
      setActiveTab("login");
    } else {
      const msg = result.error || (lang === "ar" ? "فشل تغيير كلمة المرور." : "Failed to change password.");
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 55% at 50% -5%, oklch(0.88 0.12 138 / 25%), transparent)" }}>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative bg-[var(--card)] rounded-3xl shadow-2xl shadow-[var(--primary)]/10 border border-[var(--border)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.68_0.17_138)] via-[oklch(0.78_0.18_100)] to-[oklch(0.68_0.17_138)]" />

          <div className="px-8 pt-8 pb-8">
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/25"
                style={{ background: "var(--primary)" }}>
                <span className="text-white text-2xl font-bold select-none">S</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">SmartEgo</h1>
              {view === "auth" && <p className="text-xs text-[var(--muted-foreground)]">{t.tagline}</p>}
            </div>

            {view === "auth" && (
              <>
                <div className="grid grid-cols-2 p-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); resetErrors(); }}
                    className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === "login"
                        ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {t.tabLogin}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("signup"); resetErrors(); }}
                    className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === "signup"
                        ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {t.tabSignup}
                  </button>
                </div>

                {activeTab === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.phoneLabel}</label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type="number"
                          required
                          value={loginData.phone}
                          onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                          placeholder={t.phonePlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-medium text-[var(--foreground)]">{t.passwordLabel}</label>
                        <button type="button" onClick={() => { setView("forgot_password"); resetErrors(); }} className="text-[10px] text-[var(--primary)] hover:underline">
                          {t.forgotPassword}
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          placeholder={t.passwordPlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-10 rtl:pr-9 rtl:pl-10 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 rtl:left-3 rtl:right-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--primary)]/20"
                    >
                      {isLoading ? <SpinnerIcon /> : <LogIn className="w-4 h-4" />}
                      <span>{t.btnLogin}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{t.nameLabel}</label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type="text"
                          required
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          placeholder={t.namePlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{t.emailLabel}</label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type="email"
                          required
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          placeholder={t.emailPlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{t.phoneLabel}</label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type="text"
                          required
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          placeholder={t.phonePlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{t.passwordLabel}</label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          placeholder={t.passwordPlaceholder}
                          disabled={isLoading}
                          className="w-full pl-9 pr-10 rtl:pr-9 rtl:pl-10 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        />
                        <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 rtl:left-3 rtl:right-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 mt-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--primary)]/20"
                    >
                      {isLoading ? <SpinnerIcon /> : <UserPlus className="w-4 h-4" />}
                      <span>{t.btnSignup}</span>
                    </button>
                  </form>
                )}
              </>
            )}

            {view === "verify_account" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{t.verifyAccountTitle}</h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{t.verifyAccountDesc}</p>
                <form onSubmit={handleVerifyAccountSubmit} className="flex flex-col gap-4 text-start">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.emailLabel}</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type="email"
                        value={verifyData.email}
                        readOnly 
                        className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.codeLabel}</label>
                    <div className="relative flex items-center">
                      <ShieldCheck className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type="text"
                        required
                        value={verifyData.code}
                        onChange={(e) => setVerifyData({ ...verifyData, code: e.target.value })}
                        placeholder={t.codePlaceholder}
                        disabled={isLoading}
                        className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50">
                    {isLoading ? <SpinnerIcon /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{t.btnVerify}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {view === "forgot_password" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{t.forgotPassTitle}</h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{t.forgotPassDesc}</p>
                <form onSubmit={handleForgotPassSubmit} className="flex flex-col gap-4 text-start">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.emailLabel}</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type="email"
                        required
                        value={forgotPassEmail}
                        onChange={(e) => setForgotPassEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        disabled={isLoading}
                        className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50">
                    {isLoading ? <SpinnerIcon /> : <RefreshCw className="w-4 h-4" />}
                    <span>{t.btnSendCode}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {view === "check_code" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{t.checkCodeTitle}</h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{t.checkCodeDesc}</p>
                <form onSubmit={handleCheckCodeSubmit} className="flex flex-col gap-4 text-start">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.emailLabel}</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type="email"
                        value={forgotPassEmail}
                        readOnly 
                        className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.codeLabel}</label>
                    <div className="relative flex items-center">
                      <ShieldCheck className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder={t.codePlaceholder}
                        disabled={isLoading || isBlocked}
                        className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      />
                    </div>
                    {isBlocked && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium text-center">
                        {t.blockedMsg}
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={isLoading || isBlocked} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50">
                    {isLoading ? <SpinnerIcon /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{t.btnCheckCode}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {view === "change_password" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{t.changePassTitle}</h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{t.changePassDesc}</p>
                <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4 text-start">
                  <div className="hidden">
                    <input type="hidden" value={forgotPassEmail} />
                    <input type="hidden" value={resetCode} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">{t.newPasswordLabel}</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 absolute left-3 text-[var(--muted-foreground)] rtl:right-3 rtl:left-auto" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        disabled={isLoading}
                        className="w-full pl-9 pr-10 rtl:pr-9 rtl:pl-10 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 rtl:left-3 rtl:right-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-all disabled:opacity-50">
                    {isLoading ? <SpinnerIcon /> : <Lock className="w-4 h-4" />}
                    <span>{t.btnChangePass}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {view !== "auth" && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => { setView("auth"); resetErrors(); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{t.backToLogin}</span>
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  role="alert"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">{t.copyright}</p>
      </motion.div>
    </div>
  );
}