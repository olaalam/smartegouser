import { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { connectTelegramBot } from "../api/telegramApi";
import { saveChannelConnection } from "../utils/channelConnections";
import { publishTelegramAccountsUpdated } from "../utils/chatUnreadEvents";

const COPY = {
  en: {
    title: "Connect your Telegram bot",
    subtitle: "Create a bot with BotFather, then paste its token below to connect it.",
    step: "1. Create your bot",
    botFather: "Open BotFather in Telegram",
    newTab: "Opens in a new tab",
    instructions: "In Telegram, send /newbot to BotFather and follow the instructions. Copy the API token it gives you.",
    token: "Bot API token",
    tokenPlaceholder: "Paste your token from BotFather",
    tokenRequired: "Enter the bot token to continue.",
    optionalSettings: "Optional bot information",
    aiContext: "AI instructions",
    aiContextPlaceholder: "Describe how your assistant should respond to customers",
    aiFile: "Knowledge file (.txt or .md, max 2 MB)",
    website: "Website URL",
    android: "Android app URL",
    ios: "iOS app URL",
    connect: "Connect bot",
    connecting: "Connecting...",
    back: "Back to connections",
    success: "Telegram bot connected successfully.",
    failure: "Could not connect the Telegram bot. Please try again.",
    invalidFile: "Choose a .txt or .md file no larger than 2 MB.",
    fileType: "Only .txt and .md files are supported.",
    fileSize: "The selected file must be 2 MB or smaller.",
  },
  ar: {
    title: "ربط بوت Telegram",
    subtitle: "أنشئي بوتًا باستخدام BotFather، ثم أدخلي التوكن أدناه لربطه.",
    step: "١. إنشاء البوت",
    botFather: "فتح BotFather في Telegram",
    newTab: "يفتح في تبويب جديد",
    instructions: "في Telegram، أرسلي /newbot إلى BotFather واتّبعي التعليمات، ثم انسخي التوكن الذي يظهر لكِ.",
    token: "توكن البوت",
    tokenPlaceholder: "الصقي التوكن من BotFather",
    tokenRequired: "أدخلي توكن البوت للمتابعة.",
    optionalSettings: "بيانات اختيارية للبوت",
    aiContext: "تعليمات الذكاء الاصطناعي",
    aiContextPlaceholder: "اكتبي طريقة الرد المطلوبة على العملاء",
    aiFile: "ملف المعلومات (.txt أو .md، بحد أقصى ٢ ميجابايت)",
    website: "رابط الموقع",
    android: "رابط تطبيق Android",
    ios: "رابط تطبيق iOS",
    connect: "ربط البوت",
    connecting: "جاري الربط...",
    back: "العودة إلى قنوات الربط",
    success: "تم ربط بوت Telegram بنجاح.",
    failure: "تعذر ربط بوت Telegram. حاولي مرة أخرى.",
    invalidFile: "اختاري ملف .txt أو .md لا يتجاوز حجمه ٢ ميجابايت.",
    fileType: "الملفات المدعومة هي .txt و .md فقط.",
    fileSize: "يجب ألا يتجاوز حجم الملف ٢ ميجابايت.",
  },
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [".txt", ".md"];

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function TelegramConnectPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [form, setForm] = useState({
    botToken: "",
    aiContext: "",
    websiteUrl: "",
    androidLink: "",
    iosLink: "",
    aiFile: null,
  });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setForm((current) => ({ ...current, aiFile: null }));
      setFileError("");
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(extension)) {
      setForm((current) => ({ ...current, aiFile: null }));
      setFileError(t.fileType);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setForm((current) => ({ ...current, aiFile: null }));
      setFileError(t.fileSize);
      event.target.value = "";
      return;
    }

    setForm((current) => ({ ...current, aiFile: file }));
    setFileError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.botToken.trim()) {
      toast.error(t.tokenRequired);
      return;
    }
    if (fileError) {
      toast.error(t.invalidFile);
      return;
    }

    const payload = new FormData();
    payload.append("bot_token", form.botToken.trim());
    if (form.aiContext.trim()) payload.append("ai_context", form.aiContext.trim());
    if (form.aiFile) payload.append("ai_file", form.aiFile);
    if (form.websiteUrl.trim()) payload.append("website_url", form.websiteUrl.trim());
    if (form.androidLink.trim()) payload.append("android_link", form.androidLink.trim());
    if (form.iosLink.trim()) payload.append("ios_link", form.iosLink.trim());

    setIsSubmitting(true);
    try {
      await connectTelegramBot(payload);
      saveChannelConnection("telegram");
      publishTelegramAccountsUpdated();
      toast.success(t.success);
      navigate("/connect");
    } catch (error) {
      console.error("Could not connect Telegram bot:", error);
      toast.error(getErrorMessage(error, t.failure));
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const fieldClassName = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/connect")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <BackIcon className="h-4 w-4" aria-hidden="true" />
          {t.back}
        </button>

        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#229ED9]/10 text-[#229ED9]">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-7">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">{t.step}</h2>
            <a
              href="https://web.telegram.org/k/#@BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {t.botFather}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">{t.instructions}</p>
            <span className="block text-xs text-[var(--muted-foreground)]">{t.newTab}</span>
          </section>

          <label className="block text-sm font-medium">
            {t.token} <span className="text-red-500">*</span>
            <input
              name="botToken"
              type="password"
              autoComplete="off"
              required
              value={form.botToken}
              onChange={updateField}
              placeholder={t.tokenPlaceholder}
              className={fieldClassName}
            />
          </label>

          <fieldset className="space-y-4 border-t border-[var(--border)] pt-5">
            <legend className="px-1 text-sm font-semibold">{t.optionalSettings}</legend>
            <label className="block text-sm font-medium">
              {t.aiContext}
              <textarea
                name="aiContext"
                value={form.aiContext}
                onChange={updateField}
                rows={4}
                placeholder={t.aiContextPlaceholder}
                className={fieldClassName}
              />
            </label>

            <label className="block text-sm font-medium">
              {t.aiFile}
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileChange}
                aria-invalid={Boolean(fileError)}
                className="mt-1.5 block w-full text-sm text-[var(--muted-foreground)] file:me-3 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)]"
              />
              {fileError && <span className="mt-1 block text-xs text-red-600">{fileError}</span>}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                {t.website}
                <input name="websiteUrl" type="url" value={form.websiteUrl} onChange={updateField} className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium">
                {t.android}
                <input name="androidLink" type="url" value={form.androidLink} onChange={updateField} className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium">
                {t.ios}
                <input name="iosLink" type="url" value={form.iosLink} onChange={updateField} className={fieldClassName} />
              </label>
            </div>
          </fieldset>

          <div className="flex justify-end border-t border-[var(--border)] pt-5">
            <button
              type="submit"
              disabled={isSubmitting || Boolean(fileError)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#229ED9] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t.connecting : t.connect}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
