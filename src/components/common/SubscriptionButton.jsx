import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateSubscription } from "../../api/subscriptionApi";

const COPY = {
  en: {
    subscribe: "Subscribe",
    unsubscribe: "Unsubscribe",
    subscribing: "Subscribing…",
    unsubscribing: "Unsubscribing…",
    subscribeSuccess: "Subscription activated.",
    unsubscribeSuccess: "Subscription cancelled.",
    subscribeError: "Could not activate the subscription.",
    unsubscribeError: "Could not cancel the subscription.",
    confirmUnsubscribe: "Are you sure you want to cancel this subscription?",
    confirmTitle: "Cancel subscription?",
    cancel: "Keep subscription",
    confirm: "Cancel subscription",
  },
  ar: {
    subscribe: "اشتراك",
    unsubscribe: "إلغاء الاشتراك",
    subscribing: "جاري الاشتراك…",
    unsubscribing: "جاري إلغاء الاشتراك…",
    subscribeSuccess: "تم تفعيل الاشتراك.",
    unsubscribeSuccess: "تم إلغاء الاشتراك.",
    subscribeError: "تعذر تفعيل الاشتراك.",
    unsubscribeError: "تعذر إلغاء الاشتراك.",
    confirmUnsubscribe: "هل أنت متأكد من إلغاء هذا الاشتراك؟",
    confirmTitle: "إلغاء الاشتراك؟",
    cancel: "الاحتفاظ بالاشتراك",
    confirm: "تأكيد الإلغاء",
  },
};

export default function SubscriptionButton({ channel, resourceId, active, lang = "en", onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef(null);
  const copy = COPY[lang] ?? COPY.en;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    else if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const update = async (subscribe) => {
    setLoading(true);
    try {
      const response = await updateSubscription(channel, resourceId, subscribe);
      if (response.data?.status === false) {
        throw new Error(response.data.message || (subscribe ? copy.subscribeError : copy.unsubscribeError));
      }
      toast.success(response.data?.message || (subscribe ? copy.subscribeSuccess : copy.unsubscribeSuccess));
      await onUpdated?.();
    } catch (error) {
      console.error(`Could not ${subscribe ? "subscribe" : "unsubscribe"} ${channel}:`, error);
      toast.error(error.response?.data?.message || error.message || (subscribe ? copy.subscribeError : copy.unsubscribeError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => active ? setConfirmOpen(true) : update(true)}
        disabled={loading}
        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (active ? copy.unsubscribing : copy.subscribing) : (active ? copy.unsubscribe : copy.subscribe)}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="unsubscribe-dialog-title"
        aria-describedby="unsubscribe-dialog-description"
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/50"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h2 id="unsubscribe-dialog-title" className="text-lg font-semibold">{copy.confirmTitle}</h2>
            <p id="unsubscribe-dialog-description" className="text-sm text-[var(--muted-foreground)]">
              {copy.confirmUnsubscribe}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setConfirmOpen(false)}
              className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)]">
              {copy.cancel}
            </button>
            <button type="button" onClick={() => { setConfirmOpen(false); update(false); }}
              className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              {copy.confirm}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
