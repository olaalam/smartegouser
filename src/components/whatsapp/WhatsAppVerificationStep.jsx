import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import SectionCard from "../ui/SectionCard";

const RESEND_COOLDOWN_MS = 60_000;
const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50";

function CodeMethodControl({ value, onChange, t }) {
  const options = [
    { value: "SMS", label: t.sms },
    { value: "VOICE", label: t.voice },
  ];
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] p-1">
      {options.map((option) => (
        <button type="button" key={option.value} onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function WhatsAppVerificationStep({ items, loading, error, refetch, lang, t, autoRequestPhone }) {
  const [method, setMethod] = useState("SMS");
  const [requestedFor, setRequestedFor] = useState(null);
  const [values, setValues] = useState({});
  const [cooldowns, setCooldowns] = useState({});
  const [now, setNow] = useState(Date.now());
  const { execute: requestCode, loading: requesting } = usePost();
  const { execute: verifyItem, loading: verifying } = usePost();
  const { execute: syncStatus, loading: syncing } = usePost();
  const autoRequestedItem = items.find((item) => item.phone === autoRequestPhone && !item.phone_verified_at);
  const visibleRequestedId = requestedFor ?? autoRequestedItem?.id;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingSeconds = (itemId) => Math.max(0, Math.ceil(((cooldowns[itemId] ?? 0) - now) / 1000));

  const request = async (item) => {
    const result = await requestCode(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${item.id}/request-code`, {
      code_method: method,
      language: lang,
    });
    if (!result.success) {
      toast.error(result.error || t.requestError);
      return;
    }
    setRequestedFor(item.id);
    setCooldowns((current) => ({ ...current, [item.id]: Date.now() + RESEND_COOLDOWN_MS }));
    toast.success(t.codeSent);
  };

  const verify = async (event, item) => {
    event.preventDefault();
    const result = await verifyItem(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${item.id}/verify-and-register`, values[item.id]);
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    setRequestedFor(null);
    toast.success(t.verifiedSuccess);
    refetch();
  };

  const sync = async (item) => {
    const result = await syncStatus(`${API_ENDPOINTS.WHATSAPP.ITEMS}/${item.id}/meta-status`, {});
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    toast.success(t.syncSuccess);
    refetch();
  };

  return (
    <SectionCard icon={ShieldCheck} title={t.title}>
      <div className="divide-y divide-[var(--border)] px-5">
        {loading ? <p className="py-5 text-sm text-[var(--muted-foreground)]">{t.loading}</p>
          : error ? <p className="py-5 text-sm text-[var(--destructive)]">{error}</p>
            : items.length === 0 ? <p className="py-6 text-sm text-[var(--muted-foreground)]">{t.noNumbers}</p>
              : items.map((item) => {
                const verified = Boolean(item.phone_verified_at);
                const codeValues = values[item.id] ?? { code: "", pin: "" };
                const cooldown = remainingSeconds(item.id);
                const isRequestedItem = visibleRequestedId === item.id;
                const requestLabel = isRequestedItem
                  ? (cooldown > 0 ? `${t.resendIn} ${cooldown}s` : t.resendCode)
                  : t.requestCode;
                return (
                  <article key={item.id} className="space-y-4 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{item.phone}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {verified ? t.verified : t.unverified}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!verified && <>
                          <CodeMethodControl value={method} onChange={setMethod} t={t} />
                          <button type="button" disabled={requesting || (isRequestedItem && cooldown > 0)} onClick={() => request(item)} className={buttonClass}>
                            <Send className="h-4 w-4" aria-hidden="true" />{requestLabel}
                          </button>
                        </>}
                        <button type="button" disabled={syncing} onClick={() => sync(item)} className={buttonClass}>
                          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />{t.sync}
                        </button>
                      </div>
                    </div>
                    {!verified && isRequestedItem && (
                      <form onSubmit={(event) => verify(event, item)} className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                          <span>{t.code}</span>
                          <input className={inputClass} required value={codeValues.code}
                            onChange={(event) => setValues((current) => ({ ...current, [item.id]: { ...codeValues, code: event.target.value } }))} />
                        </label>
                        <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                          <span>{t.pin}</span>
                          <input className={inputClass} required value={codeValues.pin}
                            onChange={(event) => setValues((current) => ({ ...current, [item.id]: { ...codeValues, pin: event.target.value } }))} />
                        </label>
                        <button type="submit" disabled={verifying}
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50" style={{ background: "var(--primary)" }}>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t.verify}
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
      </div>
    </SectionCard>
  );
}