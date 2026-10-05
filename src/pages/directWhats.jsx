import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import WhatsAppNumbersStep from "../components/whatsapp/WhatsAppNumbersStep";
import { useGet } from "../hooks/useGet";
import { usePost } from "../hooks/usePost";
import { API_ENDPOINTS } from "../utils/constants";
import T from "./whatsAppTranslations";

const DIRECT_COPY = {
  en: {
    title: "Direct WhatsApp",
    subtitle: "Add a WhatsApp number and subscribe immediately without verification.",
    subscribe: "Subscribe",
    subscribing: "Subscribing…",
    subscribeSuccess: "WhatsApp subscription started.",
    subscribeFailed: "Could not subscribe to this WhatsApp number. Please try again.",
  },
  ar: {
    title: "واتساب مباشر",
    subtitle: "أضف رقم واتساب واشترك مباشرةً دون الحاجة إلى التحقق.",
    subscribe: "اشتراك",
    subscribing: "جاري الاشتراك…",
    subscribeSuccess: "تم بدء الاشتراك في واتساب.",
    subscribeFailed: "تعذر الاشتراك في رقم واتساب. حاول مرة أخرى.",
  },
};

export default function DirectWhatsAppPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const navigate = useNavigate();
  const t = T[lang] ?? T.en;
  const copy = DIRECT_COPY[lang] ?? DIRECT_COPY.en;
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.WHATSAPP.ITEMS);
  const { execute: submitSubscription } = usePost();
  const [subscribingId, setSubscribingId] = useState(null);
  const items = data?.data ?? [];

  const subscribe = async (item) => {
    setSubscribingId(item.id);
    const result = await submitSubscription(API_ENDPOINTS.WHATSAPP.DIRECT_SUBSCRIPTION, {
      whats_item_id: item.id,
    });
    setSubscribingId(null);
    if (!result.success || result.data?.success === false) {
      toast.error(result.error || result.data?.message || copy.subscribeFailed);
      return;
    }
    navigate(`/whatsapp-chat?whatsItemId=${encodeURIComponent(item.id)}`);
    toast.success(copy.subscribeSuccess, { duration: 4000 });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]" dir={isRTL ? "rtl" : "ltr"}>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{copy.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{copy.subtitle}</p>
          </div>
        </header>

        <WhatsAppNumbersStep
          items={items}
          loading={loading}
          error={error}
          refetch={refetch}
          lang={lang}
          isRTL={isRTL}
          t={{ ...t.numbers, subscribe: copy.subscribe, subscribing: copy.subscribing, subscribeSuccess: copy.subscribeSuccess, subscribeFailed: copy.subscribeFailed }}
          directMode
          onCreated={subscribe}
          onSubscribe={subscribe}
          subscribingId={subscribingId}
        />
      </main>
    </div>
  );
}