import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BrainCircuit, FileText, Save, Upload, X } from "lucide-react";
import { getMessengerAIData } from "../../api/messengerApi";
import { getInstagramAIData } from "../../api/instagramApi";
import { useGet } from "../../hooks/useGet";
import { useMinimumLoading } from "../../hooks/useMinimumLoading";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import Loader from "../common/Loader";

const copy = {
  en: {
    title: "AI assistant", subtitle: "Manage the AI context and knowledge file for this channel.",
    messenger: "Facebook Messenger", context: "AI context",
    instagram: "Instagram", instagramAccount: "Instagram account", noLinkedInstagramItem: "No Instagram item is linked to this account.",
    website: "Website URL", android: "Android app link", ios: "iOS app link", fileTooLarge: "The file must be 2 MB or smaller.",
    contextHint: "Instructions and information the assistant should use when replying.",
    file: "AI file", chooseFile: "Choose file", removeFile: "Remove file", fileHint: "Upload a knowledge file for the assistant.",
    save: "Save AI settings", saving: "Saving…", loading: "Loading AI settings…",
    noFile: "No AI file configured", saved: "AI settings saved.",
    loadError: "Could not load AI settings.", saveError: "Could not save AI settings.",
    noChanges: "No changes to save.", retry: "Try again",
  },
  ar: {
    title: "مساعد الذكاء الاصطناعي", subtitle: "إدارة سياق الذكاء الاصطناعي وملف المعرفة لهذه القناة.",
    messenger: "ماسنجر فيسبوك", context: "سياق الذكاء الاصطناعي",
    instagram: "Instagram", instagramAccount: "حساب Instagram", noLinkedInstagramItem: "لا يوجد عنصر Instagram مرتبط بهذا الحساب.",
    website: "رابط الموقع", android: "رابط تطبيق Android", ios: "رابط تطبيق iOS", fileTooLarge: "يجب ألا يتجاوز حجم الملف 2 ميجابايت.",
    contextHint: "التعليمات والمعلومات التي يستخدمها المساعد عند الرد.",
    file: "ملف الذكاء الاصطناعي", chooseFile: "اختيار ملف", removeFile: "حذف الملف", fileHint: "ارفعي ملف معرفة ليستخدمه المساعد.",
    save: "حفظ إعدادات AI", saving: "جاري الحفظ…", loading: "جاري تحميل إعدادات AI…",
    noFile: "لا يوجد ملف AI محدد", saved: "تم حفظ إعدادات AI.",
    loadError: "تعذر تحميل إعدادات AI.", saveError: "تعذر حفظ إعدادات AI.",
    noChanges: "لا توجد تغييرات لحفظها.", retry: "حاولي مرة أخرى",
  },
};

const normalizeData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return payload && typeof payload === "object" ? payload : {};
};

function useAIData(loader, resourceId, errorFallback) {
  const emptyData = { ai_context: "", ai_file: "", android_link: "", ios_link: "", website_url: "" };
  const [data, setData] = useState(emptyData);
  const [initialData, setInitialData] = useState(emptyData);
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
          android_link: result.android_link ?? "",
          ios_link: result.ios_link ?? "",
          website_url: result.website_url ?? "",
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

function AIFields({ data, setData, saving, hasChanges, selectedFile, fileInputRef, onFileChange, onClearFile, t, onSubmit }) {
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
      {[["website_url", t.website], ["android_link", t.android], ["ios_link", t.ios]].map(([name, label]) => (
        <label key={name} className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
          <input type="url" value={data[name] ?? ""}
            onChange={(event) => setData((current) => ({ ...current, [name]: event.target.value }))}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]" />
        </label>
      ))}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-[var(--foreground)]">{t.file}</span>
        <span className="flex min-h-11 flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
          <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">
            <Upload className="h-4 w-4" aria-hidden="true" />{t.chooseFile}
            <input ref={fileInputRef} type="file" className="sr-only" onChange={onFileChange} />
          </label>
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedFile?.name || data.ai_file?.split(/[\\/]/).pop() || t.noFile}</span>
          </span>
          {(selectedFile || data.ai_file) && (
            <button type="button" onClick={onClearFile} title={t.removeFile} aria-label={t.removeFile}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">{t.fileHint}</span>
      </div>
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
  const { data, setData, initialData, showLoader, error, retry } = useAIData(
    getMessengerAIData,
    pageId,
    t.loadError
  );
  const { execute, loading: saving } = usePost();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const maxFileBytes = 2 * 1024 * 1024;

  const save = async (event) => {
    event.preventDefault();
    if (selectedFile && selectedFile.size > maxFileBytes) {
      toast.error(t.fileTooLarge);
      return;
    }
    const payload = new FormData();
    payload.append("page_id", pageId);
    payload.append("ai_context", data.ai_context || "");
    payload.append("ai_file", selectedFile || data.ai_file || "");
    payload.append("android_link", data.android_link || "");
    payload.append("ios_link", data.ios_link || "");
    payload.append("website_url", data.website_url || "");
    const result = await execute(API_ENDPOINTS.MESSENGER.AI_DATA, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (result.success) {
      toast.success(t.saved);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      retry();
    }
    else toast.error(result.error || t.saveError);
  };

  if (showLoader || error) return <LoadState loading={showLoader} error={error} retry={retry} t={t} />;
  const hasChanges = data.ai_context !== initialData.ai_context
    || data.ai_file !== initialData.ai_file
    || data.android_link !== initialData.android_link
    || data.ios_link !== initialData.ios_link
    || data.website_url !== initialData.website_url
    || Boolean(selectedFile);
  const onClearFile = () => {
    if (selectedFile) setSelectedFile(null);
    else setData((current) => ({ ...current, ai_file: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return <AIFields data={data} setData={setData} saving={saving} hasChanges={hasChanges} selectedFile={selectedFile}
    fileInputRef={fileInputRef} onFileChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
    onClearFile={onClearFile} t={t} onSubmit={save} />;
}

export function InstagramAISettings({ instagramId, lang }) {
  const maxFileBytes = 2 * 1024 * 1024;
  const t = copy[lang] ?? copy.en;
  const { data: itemsResponse, loading, error, refetch } = useGet(API_ENDPOINTS.INSTAGRAM.ITEMS);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);
  const items = itemsResponse?.data ?? [];
  const item = items.find((entry) => String(entry.instagram_id) === String(instagramId));
  const [formOverrides, setFormOverrides] = useState({});
  const [aiFile, setAiFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const formValues = {
    ai_context: formOverrides.ai_context ?? item?.ai_context ?? "",
    android_link: formOverrides.android_link ?? item?.android_link ?? "",
    ios_link: formOverrides.ios_link ?? item?.ios_link ?? "",
    website_url: formOverrides.website_url ?? item?.website_url ?? "",
  };
  const updateField = (name, value) => setFormOverrides((current) => ({ ...current, [name]: value }));

  const saveSettings = async (event) => {
    event.preventDefault();
    if (!item) return;
    if (aiFile && aiFile.size > maxFileBytes) {
      toast.error(t.fileTooLarge);
      return;
    }

    const payload = new FormData();
    payload.append("instagram_id", String(instagramId));
    payload.append("instagram_item_id", String(item.id));
    payload.append("ai_context", formValues.ai_context);
    payload.append("android_link", formValues.android_link);
    payload.append("ios_link", formValues.ios_link);
    payload.append("website_url", formValues.website_url);
    if (aiFile) payload.append("ai_file", aiFile);

    setSaving(true);
    try {
      await getInstagramAIData(payload);
      toast.success(t.saved);
      setAiFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetch();
    } catch (uploadError) {
      toast.error(uploadError.response?.data?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="ai-settings" aria-labelledby="instagram-ai-heading" className="scroll-mt-6 border-t border-[var(--border)] pt-6">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary)]"><BrainCircuit className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <h2 id="instagram-ai-heading" className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
        </div>
      </header>
      {showLoader ? <div className="grid min-h-48 place-items-center"><Loader text={t.loading} /></div>
        : error ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3">
            <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>
            <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>{t.retry}</button>
          </div>
        ) : !item ? <p className="border-y border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">{t.noLinkedInstagramItem}</p>
          : (
            <div className="space-y-6">
              <form onSubmit={saveSettings} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--foreground)]">{t.context}</span>
                  <textarea value={formValues.ai_context} onChange={(event) => updateField("ai_context", event.target.value)}
                    className="min-h-32 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]" />
                </label>
                {[["website_url", t.website], ["android_link", t.android], ["ios_link", t.ios]].map(([name, label]) => (
                  <label key={name} className="block space-y-1.5">
                    <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                    <input type="url" value={formValues[name]} onChange={(event) => updateField(name, event.target.value)}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]" />
                  </label>
                ))}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"><FileText className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />{t.file}</div>
                  <p className="text-xs text-[var(--muted-foreground)]">{aiFile?.name || item.ai_file || t.noFile}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
                      <Upload className="h-4 w-4" aria-hidden="true" />{t.chooseFile}
                      <input ref={fileInputRef} type="file" onChange={(event) => setAiFile(event.target.files?.[0] ?? null)} className="sr-only" />
                    </label>
                    {aiFile && (
                      <button type="button" onClick={() => { setAiFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        title={t.removeFile} aria-label={t.removeFile}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end border-t border-[var(--border)] pt-4">
                  <button type="submit" disabled={saving}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "var(--primary)" }}>
                    <Save className="h-4 w-4" aria-hidden="true" />{saving ? t.saving : t.save}
                  </button>
                </div>
              </form>
            </div>
          )}
    </section>
  );
}

export default function AISettingsPanel({ pageId, lang }) {
  const t = copy[lang] ?? copy.en;

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

      <MessengerAI key={pageId} pageId={pageId} t={t} />
    </section>
  );
}