import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Send } from "lucide-react";
import { useGet } from "../../hooks/useGet";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import Loader from "../common/Loader";
import SectionCard from "../ui/SectionCard";

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

// Assumes discount/tax "type" is either "percentage" or a flat amount — confirm this matches the backend.
function getPricing(pkg) {
  const base = Number(pkg.price) || 0;
  let afterDiscount = base;
  if (pkg.discount) {
    const amount = Number(pkg.discount.amount) || 0;
    afterDiscount = pkg.discount.type === "percentage" ? base * (1 - amount / 100) : Math.max(0, base - amount);
  }
  let final = afterDiscount;
  if (pkg.tax) {
    const amount = Number(pkg.tax.amount) || 0;
    final += pkg.tax.type === "percentage" ? afterDiscount * (amount / 100) : amount;
  }
  return { base, final };
}

export default function WhatsAppPackageStep({ items, lang, t }) {
  const { data, loading, error } = useGet(`${API_ENDPOINTS.WHATSAPP.PACKAGES}/${lang}`);
  const { execute: submitOrder, loading: ordering } = usePost();
  const [itemId, setItemId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const packages = data?.whats_packages ?? data?.data?.whats_packages ?? [];
  const verifiedItems = items.filter((item) => Boolean(item.phone_verified_at));
  const selectedPackage = packages.find((pkg) => String(pkg.id) === packageId);

  const placeOrder = async (event) => {
    event.preventDefault();
    const item = verifiedItems.find((entry) => String(entry.id) === itemId);
    if (!item || !packageId) return;

    const payload = new FormData();
    payload.append("whats_item_id", String(item.id));
    payload.append("package_id", packageId);
    payload.append("android_link", item.android_link ?? "");
    payload.append("ios_link", item.ios_link ?? "");
    payload.append("website_url", item.website_url ?? "");
    payload.append("ai_context", item.ai_context ?? "");
    if (aiFile instanceof File) payload.append("ai_file", aiFile);

    const result = await submitOrder(API_ENDPOINTS.WHATSAPP.ORDERS, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!result.success) {
      toast.error(result.error || t.error);
      return;
    }
    toast.success(t.success);
    setAiFile(null);
  };

  return (
    <SectionCard icon={Send} title={t.title}>
      <div className="space-y-5 p-5">
        {loading ? <Loader text={t.loading} /> : error ? (
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        ) : !packages.length ? <p className="text-sm text-[var(--muted-foreground)]">{t.noPackages}</p> : (
          <form onSubmit={placeOrder} className="space-y-5">
            <label className="block space-y-1.5 text-sm font-medium text-[var(--foreground)]">
              <span>{t.chooseNumber}</span>
              <select className={inputClass} required value={itemId} onChange={(event) => setItemId(event.target.value)}>
                <option value="" disabled>{t.chooseNumber}</option>
                {verifiedItems.map((item) => <option key={item.id} value={item.id}>{item.phone}</option>)}
              </select>
              {!verifiedItems.length && <span className="block text-xs text-[var(--muted-foreground)]">{t.noNumbers}</span>}
            </label>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const { base, final } = getPricing(pkg);
                const hasDiscount = Boolean(pkg.discount) && final < base;
                const selected = packageId === String(pkg.id);
                return (
                  <button type="button" key={pkg.id} onClick={() => setPackageId(String(pkg.id))}
                    className={`flex flex-col gap-2 rounded-xl border p-4 text-start transition-colors ${
                      selected ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--muted)]/50"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{pkg.names?.[lang] ?? pkg.name}</span>
                      {selected && <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{pkg.msg_number} {t.messages} · {pkg.months} {t.months}</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[var(--foreground)]">{final.toFixed(2)}</span>
                      {hasDiscount && <span className="text-xs text-[var(--muted-foreground)] line-through">{base.toFixed(2)}</span>}
                    </div>
                    {hasDiscount && (
                      <span className="w-fit rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        {pkg.discount.name || t.discount || "Discount"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <label className="block space-y-1.5 text-sm font-medium text-[var(--foreground)]">
              <span>{t.aiFile}</span>
              <input className={inputClass} type="file" onChange={(event) => setAiFile(event.target.files?.[0] ?? null)} />
            </label>

            <button type="submit" disabled={ordering || !verifiedItems.length || !selectedPackage}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50" style={{ background: "var(--primary)" }}>
              <Send className="h-4 w-4" aria-hidden="true" />{t.order}
            </button>
          </form>
        )}
      </div>
    </SectionCard>
  );
}