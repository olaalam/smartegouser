import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import { saveChannelConnection } from "../../utils/channelConnections";
import SectionCard from "../ui/SectionCard";

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50";

export default function WhatsAppVerificationStep({ items, loading, error, refetch, t }) {
  const [values, setValues] = useState({});
  const { execute: registerItem, loading: registering } = usePost();
  const { execute: syncStatus, loading: syncing } = usePost();

  const register = async (event, item) => {
    event.preventDefault();
    const pin = values[item.id]?.pin?.trim();
    const result = await registerItem(API_ENDPOINTS.WHATSAPP.REGISTER(item.id), pin ? { pin } : {});
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    saveChannelConnection("whatsapp");
    toast.success(t.verifiedSuccess);
    await refetch();
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
                const pin = values[item.id]?.pin ?? "";
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
                        <button type="button" disabled={syncing} onClick={() => sync(item)} className={buttonClass}>
                          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />{t.sync}
                        </button>
                      </div>
                    </div>
                    {!verified && (
                      <form onSubmit={(event) => register(event, item)} className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="space-y-1.5 text-sm font-medium text-[var(--foreground)]">
                          <span>{t.pin}</span>
                          <input className={inputClass} type="text" inputMode="numeric" autoComplete="one-time-code" value={pin}
                            onChange={(event) => setValues((current) => ({ ...current, [item.id]: { pin: event.target.value } }))} />
                        </label>
                        <button type="submit" disabled={registering}
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50" style={{ background: "var(--primary)" }}>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t.register}
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