import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrainCircuit, FileText, MessageCircle, MessageSquare, Save } from "lucide-react";
import { getMessengerAIData } from "../../api/messengerApi";
import { getWhatsAppAIData } from "../../api/whatsappApi";
import { useGet } from "../../hooks/useGet";
import { useMinimumLoading } from "../../hooks/useMinimumLoading";
import { useMutation } from "../../hooks/useMutation";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import Loader from "../common/Loader";

const copy = {
  en: {
    title: "AI assistant", subtitle: "Manage the AI context and knowledge file for this channel.",
    messenger: "Facebook Messenger", whatsapp: "WhatsApp", context: "AI context",
    contextHint: "Instructions and information the assistant should use when replying.",
    file: "AI file", fileHint: "File path or reference returned by the API.",
    save: "Save AI settings", saving: "Saving…", loading: "Loading AI settings…",
    loadingNumbers: "Loading WhatsApp numbers…", noNumbers: "No WhatsApp numbers are available for this account.",
    noFile: "No AI file configured", saved: "AI settings saved.",
    loadError: "Could not load AI settings.", saveError: "Could not save AI settings.",
    noChanges: "No changes to save.", retry: "Try again", selectNumber: "Choose a WhatsApp number",
  },
  ar: {
    title: "مساعد الذكاء الاصطناعي", subtitle: "إدارة سياق الذكاء الاصطناعي وملف المعرفة لهذه القناة.",
    messenger: "ماسنجر فيسبوك", whatsapp: "واتساب", context: "سياق الذكاء الاصطناعي",
    contextHint: "التعليمات والمعلومات التي يستخدمها المساعد عند الرد.",
    file: "ملف الذكاء الاصطناعي", fileHint: "مسار الملف أو المرجع الذي ترجعه واجهة API.",
    save: "حفظ إعدادات AI", saving: "جاري الحفظ…", loading: "جاري تحميل إعدادات AI…",
    loadingNumbers: "جاري تحميل أرقام واتساب…", noNumbers: "لا توجد أرقام واتساب متاحة لهذا الحساب.",
    noFile: "لا يوجد ملف AI محدد", saved: "تم حفظ إعدادات AI.",
    loadError: "تعذر تحميل إعدادات AI.", saveError: "تعذر حفظ إعدادات AI.",
    noChanges: "لا توجد تغييرات لحفظها.", retry: "حاولي مرة أخرى", selectNumber: "اختاري رقم واتساب",
  },
};

const normalizeData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return payload && typeof payload === "object" ? payload : {};
};

function useAIData(loader, resourceId, errorFallback) {
  const [data, setData] = useState({ ai_context: "", ai_file: "" });
  const [initialData, setInitialData] = useState({ ai_context: "", ai_file: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(0);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);

  useEffect(() => {
    let isCurrent = true;
    loader(resourceId)
      .then((response) => {
        if (!isCurrent) return;
        const result = normalizeData(response);
        const nextData = {
          ai_context: result.ai_context ?? "",
          ai_file: result.ai_file ?? "",
        };
        setData(nextData);
        setInitialData(nextData);
        setError("");
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || errorFallback);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [loader, resourceId, requestId, errorFallback]);

  const retry = () => {
    beginLoading();
    setLoading(true);
    setRequestId((current) => current + 1);
  };

  return { data, setData, initialData, setInitialData, loading, showLoader, error, retry };
}

function AIFields({ data, setData, saving, hasChanges, t, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--foreground)]">{t.context}</span>
        <textarea
          value={data.ai_context}
          onChange={(event) => setData((current) => ({ ...current, ai_context: event.target.value }))}
          className="min-h-32 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
          placeholder={t.contextHint}
        />
        <span className="text-xs text-[var(--muted-foreground)]">{t.contextHint}</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--foreground)]">{t.file}</span>
        <span className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
          <input
            type="text"
            value={data.ai_file}
            onChange={(event) => setData((current) => ({ ...current, ai_file: event.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none"
            placeholder={t.noFile}
          />
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">{t.fileHint}</span>
      </label>
      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <button type="submit" disabled={saving || !hasChanges} title={!hasChanges ? t.noChanges : undefined}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          <Save className="h-4 w-4" aria-hidden="true" />{saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}

function LoadState({ error, loading, retry, t }) {
  if (loading) return <div className="grid min-h-48 place-items-center"><Loader text={t.loading} /></div>;
  if (!error) return null;
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3">
      <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>
      <button type="button" onClick={retry} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
        {t.retry}
      </button>
    </div>
  );
}

function MessengerAI({ pageId, t }) {
  const { data, setData, initialData, setInitialData, showLoader, error, retry } = useAIData(
    getMessengerAIData,
    pageId,
    t.loadError
  );
  const { execute, loading: saving } = usePost();

  const save = async (event) => {
    event.preventDefault();
    const result = await execute(API_ENDPOINTS.MESSENGER.AI_DATA, {
      page_id: pageId,
      ai_context: data.ai_context || null,
      ai_file: data.ai_file || null,
    });
    if (result.success) {
      setInitialData(data);
      toast.success(t.saved);
    }
    else toast.error(result.error || t.saveError);
  };

  if (showLoader || error) return <LoadState loading={showLoader} error={error} retry={retry} t={t} />;
  const hasChanges = data.ai_context !== initialData.ai_context || data.ai_file !== initialData.ai_file;
  return <AIFields data={data} setData={setData} saving={saving} hasChanges={hasChanges} t={t} onSubmit={save} />;
}

function WhatsAppAI({ itemId, t }) {
  const { data, setData, initialData, setInitialData, showLoader, error, retry } = useAIData(
    getWhatsAppAIData,
    itemId,
    t.loadError
  );
  const { mutate, loading: saving } = useMutation();

  const save = async (event) => {
    event.preventDefault();
    const result = await mutate(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${itemId}`, "PUT", {
      ai_context: data.ai_context || null,
      ai_file: data.ai_file || null,
    });
    if (result.success) {
      setInitialData(data);
      toast.success(t.saved);
    }
    else toast.error(result.error || t.saveError);
  };

  if (showLoader || error) return <LoadState loading={showLoader} error={error} retry={retry} t={t} />;
  const hasChanges = data.ai_context !== initialData.ai_context || data.ai_file !== initialData.ai_file;
  return <AIFields data={data} setData={setData} saving={saving} hasChanges={hasChanges} t={t} onSubmit={save} />;
}

export default function AISettingsPanel({ pageId, lang }) {
  const t = copy[lang] ?? copy.en;
  const [channel, setChannel] = useState("messenger");
  const [selectedWhatsId, setSelectedWhatsId] = useState("");
  const { data: numbersResponse, loading: numbersLoading, error: numbersError, refetch } = useGet(API_ENDPOINTS.WHATSAPP.ITEMS);
  const { isVisible: showNumbersLoader, beginLoading } = useMinimumLoading(numbersLoading);
  const numbers = numbersResponse?.data ?? [];
  const selectedNumber = numbers.find((number) => String(number.id) === selectedWhatsId) ?? numbers[0] ?? null;

  return (
    <section id="ai-settings" aria-labelledby="ai-settings-heading" className="scroll-mt-6 border-t border-[var(--border)] pt-6">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary)]">
          <BrainCircuit className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="ai-settings-heading" className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
        </div>
      </header>

      <div className="mb-4 flex w-fit max-w-full rounded-lg border border-[var(--border)] p-1" role="tablist" aria-label={t.title}>
        {[
          ["messenger", t.messenger, MessageSquare],
          ["whatsapp", t.whatsapp, MessageCircle],
        ].map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={channel === key} onClick={() => setChannel(key)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${channel === key ? "bg-[var(--primary)] text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {channel === "messenger" ? (
        <MessengerAI key={pageId} pageId={pageId} t={t} />
      ) : showNumbersLoader ? (
        <div className="grid min-h-48 place-items-center"><Loader text={t.loadingNumbers} /></div>
      ) : numbersError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3">
          <p role="alert" className="text-sm text-[var(--destructive)]">{numbersError}</p>
          <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>{t.retry}</button>
        </div>
      ) : !selectedNumber ? (
        <p className="border-y border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">{t.noNumbers}</p>
      ) : (
        <div className="space-y-4">
          <label className="block max-w-md space-y-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">{t.selectNumber}</span>
            <select value={selectedNumber.id} onChange={(event) => setSelectedWhatsId(event.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
              {numbers.map((number) => <option key={number.id} value={number.id}>{number.phone || number.verified_name || `#${number.id}`}</option>)}
            </select>
          </label>
          <WhatsAppAI key={selectedNumber.id} itemId={selectedNumber.id} t={t} />
        </div>
      )}
    </section>
  );
}