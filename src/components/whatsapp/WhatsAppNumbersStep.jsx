import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Pencil, Plus, Smartphone, Trash2, Upload, X } from "lucide-react";
import { useDelete } from "../../hooks/useDelete";
import { useMutation } from "../../hooks/useMutation";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import Loader from "../common/Loader";
import SectionCard from "../ui/SectionCard";

const EMPTY_FORM = {
  phone: "", verified_name: "", android_link: "", ios_link: "", website_url: "",
  auto_request_code: true, code_method: "SMS", ai_context: "", ai_file: null, ai_file_value: "",
};
const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50";
const sectionHeadingClass = "text-sm font-semibold text-[var(--foreground)]";

function makePayload(form, lang) {
  const payload = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (key === "auto_request_code") {
      payload.append(key, value ? "1" : "0");
    } else if (key !== "ai_file" && key !== "ai_file_value" && value !== null && value !== undefined) {
      payload.append(key, String(value));
    }
  });
  payload.append("language", lang);
  if (form.ai_file instanceof File) payload.append("ai_file", form.ai_file);
  return payload;
}

function CodeMethodControl({ value, onChange, t }) {
  const options = [
    { value: "SMS", label: t.sms },
    { value: "VOICE", label: t.voice },
  ];
  return (
    <div className="inline-flex w-full rounded-lg border border-[var(--border)] p-1 sm:w-auto">
      {options.map((option) => (
        <button type="button" key={option.value} onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
            value === option.value ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FileField({ label, fileName, onChange, chooseLabel, emptyLabel }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`${buttonClass} cursor-pointer`}>
          <Upload className="h-4 w-4" aria-hidden="true" />{chooseLabel}
        </span>
        <span className="truncate text-xs text-[var(--muted-foreground)]">{fileName || emptyLabel}</span>
        <input type="file" className="sr-only" onChange={onChange} />
      </div>
    </label>
  );
}

export default function WhatsAppNumbersStep({ items, loading, error, refetch, lang, isRTL, t, onCreated }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const { execute: createItem, loading: creating } = usePost();
  const { mutate: updateItem, loading: updating } = useMutation();
  const { remove: deleteItem, loading: deleting } = useDelete();
  const editingItem = items.find((item) => item.id === editingId);
  const hasItems = items.length > 0;

  // Open the form automatically the first time there's nothing to manage yet;
  // once numbers exist, the list takes priority and the form stays tucked away.
  useEffect(() => {
    if (!loading && !hasItems) setFormOpen(true);
  }, [loading, hasItems]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormOpen(false);
  };

  const saveItem = async (event) => {
    event.preventDefault();
    const isEditing = Boolean(editingId);
    const createdPhone = form.phone;
    const autoRequestCode = form.auto_request_code;
    const payload = isEditing ? {
      android_link: form.android_link || null,
      ios_link: form.ios_link || null,
      website_url: form.website_url || null,
      ai_context: form.ai_context || null,
      ai_file: form.ai_file_value || null,
    } : makePayload(form, lang);
    const result = isEditing
      ? await updateItem(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${editingId}`, "PUT", payload)
      : await createItem(API_ENDPOINTS.WHATSAPP.ITEMS, payload, { headers: { "Content-Type": "multipart/form-data" } });
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    toast.success(isEditing ? t.editSuccess : t.addSuccess);
    resetForm();
    await refetch();
    if (!isEditing) onCreated?.(createdPhone, autoRequestCode);
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setFormOpen(true);
    setForm({
      ...EMPTY_FORM,
      phone: item.phone ?? "",
      verified_name: item.verified_name ?? "",
      android_link: item.android_link ?? "",
      ios_link: item.ios_link ?? "",
      website_url: item.website_url ?? "",
      ai_context: item.ai_context ?? "",
      ai_file_value: item.ai_file ?? "",
      ai_file: null,
    });
  };

  const removeItem = async (item) => {
    if (!window.confirm(t.confirmDelete)) return;
    const result = await deleteItem(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${item.id}`);
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    toast.success(t.deleteSuccess);
    refetch();
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={Smartphone} title={t.title}>
        {loading ? <div className="p-5"><Loader text={t.loading} /></div> : error ? (
          <div className="space-y-3 p-5 text-sm text-[var(--destructive)]">
            <p>{error || t.loadError}</p>
            <button type="button" onClick={refetch} className={buttonClass}>{t.retry}</button>
          </div>
        ) : !hasItems ? <p className="p-5 text-sm text-[var(--muted-foreground)]">{t.noNumbers}</p> : (
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{item.phone}</p>
                      {item.verified_name && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item.verified_name}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.phone_verified_at ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.phone_verified_at ? t.verified : t.unverified}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => editItem(item)} className={buttonClass} aria-label={t.edit}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" disabled={deleting} onClick={() => removeItem(item)} className={`${buttonClass} text-red-600`} aria-label={t.delete}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {!formOpen ? (
        <button type="button" onClick={() => setFormOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--muted)]/40">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
          {t.addNumber}
        </button>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={editingId ?? "new"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <SectionCard icon={editingId ? Pencil : Plus} title={editingId ? t.editNumber : t.addNumber}>
              <form onSubmit={saveItem} className="space-y-6 p-5" dir={isRTL ? "rtl" : "ltr"}>
                {editingItem && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-3">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">{t.editingPhone}</p>
                      <p className="mt-0.5 font-semibold text-[var(--foreground)]">{editingItem.phone}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${editingItem.phone_verified_at ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {editingItem.phone_verified_at ? t.verified : t.unverified}
                    </span>
                  </div>
                )}

                {!editingId && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.phone}</span>
                      <input className={inputClass} type="tel" required value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.verifiedName}</span>
                      <input className={inputClass} type="text" value={form.verified_name}
                        onChange={(event) => setForm((current) => ({ ...current, verified_name: event.target.value }))} />
                    </label>
                  </div>
                )}

                <div className="space-y-3 border-t border-[var(--border)] pt-5">
                  <p className={sectionHeadingClass}>{t.linksHeading ?? "App & website links"}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.androidLink}</span>
                      <input className={inputClass} type="url" value={form.android_link}
                        onChange={(event) => setForm((current) => ({ ...current, android_link: event.target.value }))} />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.iosLink}</span>
                      <input className={inputClass} type="url" value={form.ios_link}
                        onChange={(event) => setForm((current) => ({ ...current, ios_link: event.target.value }))} />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)] sm:col-span-2">
                      <span>{t.websiteUrl}</span>
                      <input className={inputClass} type="url" value={form.website_url}
                        onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))} />
                    </label>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--border)] pt-5">
                  <p className={sectionHeadingClass}>{t.aiHeading ?? "AI assistant"}</p>
                  <label className="block space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                    <span>{t.aiContext}</span>
                    <textarea className={`${inputClass} min-h-24 resize-y`} value={form.ai_context}
                      onChange={(event) => setForm((current) => ({ ...current, ai_context: event.target.value }))} />
                  </label>
                  {!editingId ? (
                    <FileField label={t.aiFile} fileName={form.ai_file?.name}
                      chooseLabel={t.chooseFile ?? "Choose file"} emptyLabel={t.noFileChosen ?? "No file chosen"}
                      onChange={(event) => setForm((current) => ({ ...current, ai_file: event.target.files?.[0] ?? null }))} />
                  ) : (
                    <label className="block space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.aiFile}</span>
                      <input className={inputClass} type="text" value={form.ai_file_value}
                        onChange={(event) => setForm((current) => ({ ...current, ai_file_value: event.target.value }))} />
                    </label>
                  )}
                </div>

                {!editingId && (
                  <div className="space-y-3 border-t border-[var(--border)] pt-5">
                    <p className={sectionHeadingClass}>{t.verificationHeading ?? "Verification"}</p>
                    <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                      <span>{t.codeMethod}</span>
                      <CodeMethodControl value={form.code_method} t={t}
                        onChange={(value) => setForm((current) => ({ ...current, code_method: value }))} />
                    </label>
                    <label className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{t.autoRequest}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {t.autoRequestHint ?? "We'll send the verification code right after this number is added."}
                        </p>
                      </div>
                      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" checked={form.auto_request_code}
                        onChange={(event) => setForm((current) => ({ ...current, auto_request_code: event.target.checked }))} />
                    </label>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
                  <button type="submit" disabled={creating || updating}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50" style={{ background: "var(--primary)" }}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{editingId ? t.saveChanges : t.save}
                  </button>
                  {(editingId || hasItems) && (
                    <button type="button" onClick={resetForm} className={buttonClass}>
                      <X className="h-4 w-4" aria-hidden="true" />{t.cancel}
                    </button>
                  )}
                </div>
              </form>
            </SectionCard>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}