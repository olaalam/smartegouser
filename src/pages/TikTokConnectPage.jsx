import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Trash2,
  Settings,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Upload,
  Globe,
  Smartphone,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  getTikTokAuthUrl,
  connectTikTokAccount,
  getTikTokAccounts,
  updateTikTokAccount,
  refreshTikTokToken,
  disconnectTikTokAccount,
} from "../api/tiktokApi";
import { saveChannelConnection } from "../utils/channelConnections";
import { publishTikTokAccountsUpdated } from "../utils/chatUnreadEvents";

const TikTokIcon = ({ className = "h-5 w-5", style = {} }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V8.47a8.28 8.28 0 0 0 4.84 1.55V6.69h-.93z" />
  </svg>
);

const COPY = {
  en: {
    title: "TikTok Integration",
    subtitle: "Connect your TikTok account to automate comments and direct messages with AI.",
    back: "Back to channels",
    connectButton: "Connect TikTok via OAuth",
    manualConnectToggle: "Direct / Manual Token Connection",
    connecting: "Connecting TikTok account...",
    loadingAccounts: "Loading connected accounts...",
    noAccounts: "No TikTok accounts connected yet.",
    noAccountsDesc: "Click the connect button above to authenticate with your TikTok Business account.",
    connectedAccounts: "Connected Accounts",
    active: "Active",
    disabled: "Disabled",
    subscriptionActive: "Subscribed",
    subscriptionExpired: "Expired",
    remainingMsgs: "Remaining Messages",
    validUntil: "Valid until",
    aiSettings: "AI & Store Settings",
    aiPrompt: "AI Prompt / Context",
    aiPromptDesc: "Instructions for AI when replying to comments and direct messages.",
    aiFile: "Knowledge / Menu File (.txt or .md, max 2MB)",
    websiteUrl: "Website URL",
    androidLink: "Android App URL",
    iosLink: "iOS App URL",
    statusToggle: "Auto-Reply Status",
    saveChanges: "Save Changes",
    saving: "Saving...",
    cancel: "Cancel",
    refresh: "Refresh Token",
    refreshing: "Refreshing...",
    disconnect: "Disconnect Account",
    disconnectConfirm: "Are you sure you want to disconnect this TikTok account?",
    openChat: "Open Live Chat",
    openId: "Open ID",
    directForm: {
      title: "Direct Token / Code Connection",
      codeOrTokenHint: "Enter the OAuth Code or provide direct Access Token + Open ID",
      code: "OAuth Code",
      codePlaceholder: "TikTok authorization code",
      accessToken: "Access Token",
      accessTokenPlaceholder: "act.xxxxxxxx...",
      openId: "Open ID",
      openIdPlaceholder: "act_8839201948",
      refreshToken: "Refresh Token (Optional)",
      refreshTokenPlaceholder: "rft.xxxxxxxx...",
      submit: "Connect Account",
    },
    toast: {
      authUrlError: "Could not retrieve TikTok authorization URL.",
      connectSuccess: "TikTok account connected successfully!",
      connectError: "Could not connect TikTok account.",
      loadError: "Could not load TikTok accounts.",
      updateSuccess: "Account settings updated successfully.",
      updateError: "Could not update account settings.",
      refreshSuccess: "Token refreshed successfully.",
      refreshError: "Could not refresh token.",
      disconnectSuccess: "Account disconnected successfully.",
      disconnectError: "Could not disconnect account.",
      invalidFile: "File must be a .txt or .md file under 2MB.",
    },
  },
  ar: {
    title: "تكامل تيك توك (TikTok)",
    subtitle: "اربط حساب تيك توك لتفعيل الردود التلقائية الذكية على التعليقات والرسائل الخاصة.",
    back: "العودة إلى قنوات الربط",
    connectButton: "ربط حساب TikTok عبر OAuth الرسمي",
    manualConnectToggle: "ربط يدوي مباشر عبر التوكن أو الكود",
    connecting: "جاري ربط حساب تيك توك...",
    loadingAccounts: "جاري تحميل الحسابات المرتبطة...",
    noAccounts: "لا يوجد حسابات تيك توك مرتبطة بعد.",
    noAccountsDesc: "اضغط على زر الربط أعلاه لتسجيل الدخول بحساب TikTok Business ومنح الصلاحيات.",
    connectedAccounts: "الحسابات المرتبطة",
    active: "مفعل والرد يعمل",
    disabled: "معطل مؤقتاً",
    subscriptionActive: "باقة نشطة",
    subscriptionExpired: "باقة منتهية",
    remainingMsgs: "الرسائل المتبقية",
    validUntil: "صالح حتى",
    aiSettings: "إعدادات الذكاء الاصطناعي والمتجر",
    aiPrompt: "سياق الذكاء الاصطناعي (Prompt)",
    aiPromptDesc: "توجيهات الـ AI للرد على استفسارات العملاء وأسلوب الحوار.",
    aiFile: "ملف المنيو / البيانات (.txt أو .md بحد أقصى 2MB)",
    websiteUrl: "رابط موقع المتجر للطلب أونلاين",
    androidLink: "رابط تطبيق Android",
    iosLink: "رابط تطبيق iOS",
    statusToggle: "حالة الرد التلقائي",
    saveChanges: "حفظ التعديلات",
    saving: "جاري الحفظ...",
    cancel: "إلغاء",
    refresh: "تجديد التوكن",
    refreshing: "جاري التجديد...",
    disconnect: "فصل وحذف الحساب",
    disconnectConfirm: "هل أنت متأكد من رغبتك في فصل وحذف هذا الحساب من النظام؟",
    openChat: "صندوق المحادثات (Live Chat)",
    openId: "معرف الحساب (Open ID)",
    directForm: {
      title: "ربط مباشر عبر الكود أو التوكن",
      codeOrTokenHint: "أدخل كود التفويض (Code) أو التوكن المباشر مع Open ID",
      code: "كود التفويض (Code)",
      codePlaceholder: "كود التفويض الراجع من تيك توك",
      accessToken: "توكن الوصول (Access Token)",
      accessTokenPlaceholder: "act.xxxxxxxx...",
      openId: "معرف الحساب (Open ID)",
      openIdPlaceholder: "act_8839201948",
      refreshToken: "توكن التجديد (Refresh Token)",
      refreshTokenPlaceholder: "rft.xxxxxxxx...",
      submit: "ربط الحساب الآن",
    },
    toast: {
      authUrlError: "تعذر توليد رابط تفويض تيك توك.",
      connectSuccess: "تم ربط حساب TikTok بنجاح وتفعيل الباقة!",
      connectError: "تعذر ربط حساب TikTok. يرجى المحاولة مرة أخرى.",
      loadError: "تعذر تحميل حسابات تيك توك.",
      updateSuccess: "تم تحديث بيانات الحساب والذكاء الاصطناعي بنجاح.",
      updateError: "تعذر تحديث البيانات.",
      refreshSuccess: "تم تجديد التوكن بنجاح.",
      refreshError: "تعذر تجديد التوكن.",
      disconnectSuccess: "تم فصل الحساب بنجاح.",
      disconnectError: "تعذر فصل الحساب.",
      invalidFile: "الملف يجب أن يكون بصيغة .txt أو .md وحجمه أقل من 2 ميجابايت.",
    },
  },
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_EXTS = [".txt", ".md"];

export default function TikTokConnectPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    code: "",
    accessToken: "",
    openId: "",
    refreshToken: "",
    aiContext: "",
    websiteUrl: "",
    androidLink: "",
    iosLink: "",
    aiFile: null,
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "active",
    aiContext: "",
    websiteUrl: "",
    androidLink: "",
    iosLink: "",
    aiFile: null,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Actions loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await getTikTokAccounts();
      const list = res.data?.data ?? res.data ?? [];
      setAccounts(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        saveChannelConnection("tiktok");
      }
    } catch (err) {
      console.error("Could not fetch TikTok accounts:", err);
      toast.error(t.toast.loadError);
    } finally {
      setLoadingAccounts(false);
    }
  }, [t.toast.loadError]);

  // Handle OAuth code callback from TikTok redirect
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      fetchAccounts();
      return;
    }

    const handleCallback = async () => {
      setIsConnectingOAuth(true);
      try {
        const redirectUri = window.location.origin + window.location.pathname;
        await connectTikTokAccount({
          code,
          redirect_uri: redirectUri,
        });
        saveChannelConnection("tiktok");
        publishTikTokAccountsUpdated();
        toast.success(t.toast.connectSuccess);
        // Clear query params from URL
        window.history.replaceState(null, "", window.location.pathname);
        await fetchAccounts();
      } catch (err) {
        console.error("TikTok OAuth connect error:", err);
        toast.error(err.response?.data?.message || t.toast.connectError);
        window.history.replaceState(null, "", window.location.pathname);
      } finally {
        setIsConnectingOAuth(false);
      }
    };

    handleCallback();
  }, [fetchAccounts, searchParams, t.toast.connectError, t.toast.connectSuccess]);

  // Initiate OAuth flow
  const handleInitiateOAuth = async () => {
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      const res = await getTikTokAuthUrl({ redirect_uri: redirectUri });
      const authUrl = res.data?.data?.authorization_url || res.data?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast.error(t.toast.authUrlError);
      }
    } catch (err) {
      console.error("Error getting TikTok auth URL:", err);
      toast.error(err.response?.data?.message || t.toast.authUrlError);
    }
  };

  // Submit manual form
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.code && (!manualForm.accessToken || !manualForm.openId)) {
      toast.error(t.directForm.codeOrTokenHint);
      return;
    }

    setManualSubmitting(true);
    try {
      const formData = new FormData();
      if (manualForm.code) formData.append("code", manualForm.code.trim());
      if (manualForm.accessToken) formData.append("access_token", manualForm.accessToken.trim());
      if (manualForm.openId) formData.append("open_id", manualForm.openId.trim());
      if (manualForm.refreshToken) formData.append("refresh_token", manualForm.refreshToken.trim());
      if (manualForm.aiContext) formData.append("ai_context", manualForm.aiContext.trim());
      if (manualForm.websiteUrl) formData.append("website_url", manualForm.websiteUrl.trim());
      if (manualForm.androidLink) formData.append("android_link", manualForm.androidLink.trim());
      if (manualForm.iosLink) formData.append("ios_link", manualForm.iosLink.trim());
      if (manualForm.aiFile) formData.append("ai_file", manualForm.aiFile);

      await connectTikTokAccount(formData);
      saveChannelConnection("tiktok");
      publishTikTokAccountsUpdated();
      toast.success(t.toast.connectSuccess);
      setShowManualForm(false);
      setManualForm({
        code: "",
        accessToken: "",
        openId: "",
        refreshToken: "",
        aiContext: "",
        websiteUrl: "",
        androidLink: "",
        iosLink: "",
        aiFile: null,
      });
      await fetchAccounts();
    } catch (err) {
      console.error("Manual connect error:", err);
      toast.error(err.response?.data?.message || t.toast.connectError);
    } finally {
      setManualSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (account) => {
    setEditingAccount(account);
    setEditForm({
      status: account.status || "active",
      aiContext: account.ai_context || "",
      websiteUrl: account.website_url || "",
      androidLink: account.android_link || "",
      iosLink: account.ios_link || "",
      aiFile: null,
    });
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;

    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", editForm.status);
      if (editForm.aiContext !== undefined) formData.append("ai_context", editForm.aiContext.trim());
      if (editForm.websiteUrl !== undefined) formData.append("website_url", editForm.websiteUrl.trim());
      if (editForm.androidLink !== undefined) formData.append("android_link", editForm.androidLink.trim());
      if (editForm.iosLink !== undefined) formData.append("ios_link", editForm.iosLink.trim());
      if (editForm.aiFile) formData.append("ai_file", editForm.aiFile);

      await updateTikTokAccount(editingAccount.id, formData);
      toast.success(t.toast.updateSuccess);
      setEditingAccount(null);
      await fetchAccounts();
    } catch (err) {
      console.error("Update account error:", err);
      toast.error(err.response?.data?.message || t.toast.updateError);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Refresh Token
  const handleRefreshToken = async (id) => {
    setActionLoadingId(id);
    try {
      await refreshTikTokToken(id);
      toast.success(t.toast.refreshSuccess);
      await fetchAccounts();
    } catch (err) {
      console.error("Refresh token error:", err);
      toast.error(err.response?.data?.message || t.toast.refreshError);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Disconnect Account
  const handleDisconnect = async (id) => {
    if (!window.confirm(t.disconnectConfirm)) return;
    setActionLoadingId(id);
    try {
      await disconnectTikTokAccount(id);
      publishTikTokAccountsUpdated();
      toast.success(t.toast.disconnectSuccess);
      await fetchAccounts();
    } catch (err) {
      console.error("Disconnect error:", err);
      toast.error(err.response?.data?.message || t.toast.disconnectError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFileValidate = (file) => {
    if (!file) return null;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || file.size > MAX_FILE_SIZE) {
      toast.error(t.toast.invalidFile);
      return null;
    }
    return file;
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <main
      className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/connect")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              title={t.back}
            >
              <BackArrow className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FE2C55] text-white">
                  <TikTokIcon className="h-4 w-4" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleInitiateOAuth}
              disabled={isConnectingOAuth}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#FE2C55] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnectingOAuth ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.connecting}
                </>
              ) : (
                <>
                  <TikTokIcon className="h-4 w-4" />
                  {t.connectButton}
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <Plus className="h-4 w-4" />
              {t.manualConnectToggle}
            </button>
          </div>
        </header>

        {/* Manual Connect Accordion / Form */}
        {showManualForm && (
          <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">{t.directForm.title}</h2>
            <p className="mb-5 text-xs text-[var(--muted-foreground)]">{t.directForm.codeOrTokenHint}</p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.directForm.code}</label>
                  <input
                    type="text"
                    value={manualForm.code}
                    onChange={(e) => setManualForm({ ...manualForm, code: e.target.value })}
                    placeholder={t.directForm.codePlaceholder}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.directForm.openId}</label>
                  <input
                    type="text"
                    value={manualForm.openId}
                    onChange={(e) => setManualForm({ ...manualForm, openId: e.target.value })}
                    placeholder={t.directForm.openIdPlaceholder}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.directForm.accessToken}</label>
                  <input
                    type="text"
                    value={manualForm.accessToken}
                    onChange={(e) => setManualForm({ ...manualForm, accessToken: e.target.value })}
                    placeholder={t.directForm.accessTokenPlaceholder}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.directForm.refreshToken}</label>
                  <input
                    type="text"
                    value={manualForm.refreshToken}
                    onChange={(e) => setManualForm({ ...manualForm, refreshToken: e.target.value })}
                    placeholder={t.directForm.refreshTokenPlaceholder}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">{t.aiPrompt}</label>
                <textarea
                  rows={2}
                  value={manualForm.aiContext}
                  onChange={(e) => setManualForm({ ...manualForm, aiContext: e.target.value })}
                  placeholder={t.aiPromptDesc}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.websiteUrl}</label>
                  <input
                    type="url"
                    value={manualForm.websiteUrl}
                    onChange={(e) => setManualForm({ ...manualForm, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.androidLink}</label>
                  <input
                    type="url"
                    value={manualForm.androidLink}
                    onChange={(e) => setManualForm({ ...manualForm, androidLink: e.target.value })}
                    placeholder="https://play.google.com/..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.iosLink}</label>
                  <input
                    type="url"
                    value={manualForm.iosLink}
                    onChange={(e) => setManualForm({ ...manualForm, iosLink: e.target.value })}
                    placeholder="https://apps.apple.com/..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">{t.aiFile}</label>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={(e) => {
                    const valid = handleFileValidate(e.target.files?.[0]);
                    setManualForm({ ...manualForm, aiFile: valid });
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5 text-xs file:me-3 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-3 file:py-1 file:text-xs file:font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FE2C55] px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {manualSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {t.directForm.submit}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Connected Accounts Section */}
        <section aria-labelledby="accounts-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="accounts-heading" className="text-base font-semibold">
              {t.connectedAccounts} ({accounts.length})
            </h2>
          </div>

          {loadingAccounts ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-5 w-5 animate-spin text-[#FE2C55]" />
                {t.loadingAccounts}
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FE2C55]/10 text-[#FE2C55]">
                <TikTokIcon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{t.noAccounts}</h3>
              <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">{t.noAccountsDesc}</p>
              <button
                type="button"
                onClick={handleInitiateOAuth}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
              >
                <TikTokIcon className="h-3.5 w-3.5" />
                {t.connectButton}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {accounts.map((account) => {
                const isActive = account.status === "active";
                const isSubActive = account.subscription_status === true;
                const msgsCount = account.available_msgs ?? account.msg_number ?? 0;
                const isLoadingAction = actionLoadingId === account.id;

                return (
                  <article
                    key={account.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:border-[var(--border)] hover:shadow-md"
                  >
                    <div>
                      {/* Top Bar: Avatar, Names, Status Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {account.avatar_url ? (
                            <img
                              src={account.avatar_url}
                              alt={account.display_name || account.username}
                              className="h-12 w-12 rounded-full border border-[var(--border)] object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FE2C55] font-bold text-white">
                              <TikTokIcon className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-[var(--foreground)]">
                              {account.display_name || account.username || `TikTok #${account.id}`}
                            </h3>
                            <p className="truncate text-xs text-[var(--muted-foreground)]">
                              @{account.username || account.open_id}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {isActive ? t.active : t.disabled}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              isSubActive
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isSubActive ? t.subscriptionActive : t.subscriptionExpired}
                          </span>
                        </div>
                      </div>

                      {/* Quota & Dates Info */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
                        <div>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{t.remainingMsgs}</p>
                          <p className="mt-0.5 font-bold text-[var(--foreground)]">{msgsCount}</p>
                        </div>
                        {account.end_date && (
                          <div>
                            <p className="text-[10px] text-[var(--muted-foreground)]">{t.validUntil}</p>
                            <p className="mt-0.5 font-medium text-[var(--foreground)]">{account.end_date}</p>
                          </div>
                        )}
                      </div>

                      {/* AI Context Preview */}
                      {account.ai_context && (
                        <div className="mt-3 rounded-lg bg-[var(--muted)]/50 p-2.5 text-xs">
                          <p className="flex items-center gap-1 font-semibold text-[var(--foreground)]">
                            <Sparkles className="h-3.5 w-3.5 text-[#FE2C55]" />
                            {t.aiPrompt}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[var(--muted-foreground)]">{account.ai_context}</p>
                        </div>
                      )}

                      {/* Attached Links Preview */}
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--muted-foreground)]">
                        {account.website_url && (
                          <a
                            href={account.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-0.5 hover:text-[var(--foreground)]"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                        {(account.android_link || account.ios_link) && (
                          <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-0.5">
                            <Smartphone className="h-3 w-3" />
                            Apps
                          </span>
                        )}
                        {account.ai_file && (
                          <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-0.5">
                            <Upload className="h-3 w-3" />
                            Knowledge File
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/chats?channel=tiktok&tiktokAccountId=${account.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE2C55] px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {t.openChat}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(account)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                          title={t.aiSettings}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRefreshToken(account.id)}
                          disabled={isLoadingAction}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
                          title={t.refresh}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAction ? "animate-spin" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDisconnect(account.id)}
                          disabled={isLoadingAction}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                          title={t.disconnect}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Edit Modal */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#FE2C55]" />
                  <h3 className="text-base font-bold">
                    {t.aiSettings} - @{editingAccount.username || editingAccount.open_id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Status Toggle */}
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.statusToggle}</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  >
                    <option value="active">{t.active}</option>
                    <option value="disabled">{t.disabled}</option>
                  </select>
                </div>

                {/* AI Context */}
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.aiPrompt}</label>
                  <textarea
                    rows={4}
                    value={editForm.aiContext}
                    onChange={(e) => setEditForm({ ...editForm, aiContext: e.target.value })}
                    placeholder={t.aiPromptDesc}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>

                {/* AI File */}
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.aiFile}</label>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => {
                      const valid = handleFileValidate(e.target.files?.[0]);
                      setEditForm({ ...editForm, aiFile: valid });
                    }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5 text-xs file:me-3 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-3 file:py-1 file:text-xs file:font-semibold"
                  />
                  {editingAccount.ai_file && !editForm.aiFile && (
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      Current file: {editingAccount.ai_file}
                    </p>
                  )}
                </div>

                {/* URLs */}
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.websiteUrl}</label>
                  <input
                    type="url"
                    value={editForm.websiteUrl}
                    onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.androidLink}</label>
                    <input
                      type="url"
                      value={editForm.androidLink}
                      onChange={(e) => setEditForm({ ...editForm, androidLink: e.target.value })}
                      placeholder="https://play.google.com/..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.iosLink}</label>
                    <input
                      type="url"
                      value={editForm.iosLink}
                      onChange={(e) => setEditForm({ ...editForm, iosLink: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FE2C55]"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FE2C55] px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {editSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {t.saveChanges}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

