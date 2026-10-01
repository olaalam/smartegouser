import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Package, LayoutList, ArrowRight, ArrowLeft,
  Loader2, ShoppingCart, CheckCircle2, MessageSquare, Hash,
} from "lucide-react";

import { useGet }  from "../hooks/useGet";
import { usePost } from "../hooks/usePost";
import { API_ENDPOINTS } from "../utils/constants";
import Loader      from "../components/common/Loader";
import SectionCard from "../components/ui/SectionCard";
import EmptyState  from "../components/ui/EmptyState";
import PackageCard from "../components/messenger/PackageCard";
import PageItem    from "../components/messenger/PageItem";

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    title: "New Subscription", subtitle: "Choose a package and link it to your Facebook page to activate auto-reply.",
    step1: "Choose Package", step2: "Select Page", step3: "Confirm Order",
    packages: "Available Packages", pages: "Your Facebook Pages", summary: "Order Summary",
    nextPage: "Next: Select Page", nextReview: "Next: Review", back: "Back",
    confirmOrder: "Confirm Order", placing: "Placing order…", loading: "Loading packages…",
    noPackages: "No packages available", noPackagesSub: "Check back later.",
    failPackages: "Failed to load packages", noPages: "No Facebook pages found",
    noPagesSub: "Make sure you granted pages_show_list permission during login.",
    failPages: "Failed to load pages",
    packageSection: "Package", pageSection: "Facebook Page",
    messages: "messages", months: "month", monthsP: "months",
    notice: "Your order will be sent to the admin for approval. Once approved, auto-reply will activate on the selected page.",
    successOrder: "Order placed! Awaiting admin approval.",
    failOrder: "Failed to place order. Please try again.",
  },
  ar: {
    title: "اشتراك جديد", subtitle: "اختر باقة واربطها بصفحتك على فيسبوك لتفعيل الرد التلقائي.",
    step1: "اختر الباقة", step2: "اختر الصفحة", step3: "تأكيد الطلب",
    packages: "الباقات المتاحة", pages: "صفحاتك على فيسبوك", summary: "ملخص الطلب",
    nextPage: "التالي: اختر الصفحة", nextReview: "التالي: المراجعة", back: "رجوع",
    confirmOrder: "تأكيد الطلب", placing: "جاري إرسال الطلب…", loading: "جاري التحميل…",
    noPackages: "لا توجد باقات متاحة", noPackagesSub: "تحقق لاحقاً.",
    failPackages: "فشل تحميل الباقات", noPages: "لم يتم العثور على صفحات",
    noPagesSub: "تأكد من منح إذن pages_show_list عند تسجيل الدخول.",
    failPages: "فشل تحميل الصفحات",
    packageSection: "الباقة", pageSection: "صفحة فيسبوك",
    messages: "رسالة", months: "شهر", monthsP: "أشهر",
    notice: "سيتم إرسال طلبك للمشرف للموافقة عليه. بعد الموافقة سيتم تفعيل الرد التلقائي على الصفحة المحددة.",
    successOrder: "تم إرسال الطلب! بانتظار موافقة المشرف.",
    failOrder: "فشل إرسال الطلب. حاول مرة أخرى.",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay },
});

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ current, t }) {
  const steps = [
    { id: 1, label: t.step1 },
    { id: 2, label: t.step2 },
    { id: 3, label: t.step3 },
  ];

  return (
    <div className="flex items-center w-full max-w-sm mx-auto">
      {steps.map((step, i) => {
        const done   = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${done   ? "bg-[var(--primary)] text-white"
                : active ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20"
                         : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-xs whitespace-nowrap font-medium ${active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full bg-[var(--border)] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: "var(--primary)" }}
                  initial={{ width: 0 }} animate={{ width: done ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Nav buttons ─────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, primary, isRTL, children }) {
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevIcon = isRTL ? ArrowRight : ArrowLeft;
  return primary ? (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--primary-foreground)]
        transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "var(--primary)" }}>
      {children} <NextIcon className="w-4 h-4" aria-hidden="true" />
    </button>
  ) : (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)]
        text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">
      <PrevIcon className="w-4 h-4" aria-hidden="true" /> {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang     = useSelector((s) => s.ui.lang);
  const t        = T[lang] ?? T.en;
  const isRTL    = lang === "ar";

  const [step, setStep]               = useState(1);
  const [selectedPkg,  setSelectedPkg]  = useState(null);
  const [selectedPageOverride, setSelectedPageOverride] = useState(null);

  const { data: pkgsData,  loading: pkgsLoading,  error: pkgsError  } = useGet(API_ENDPOINTS.MESSENGER.PACKAGES);
  const { data: pagesData, loading: pagesLoading, error: pagesError } = useGet(API_ENDPOINTS.MESSENGER.PAGES);
  const { execute: submitOrder, loading: submitting } = usePost();

  const packages = pkgsData?.face_packages ?? [];
  const pages    = pagesData?.data         ?? [];
  const requestedPageId = searchParams.get("pageId");
  const selectedPage = selectedPageOverride ?? pages.find((page) => String(page.page_id) === requestedPageId) ?? null;

  const handleSubmit = async () => {
    if (!selectedPkg || !selectedPage) return;
    const result = await submitOrder(API_ENDPOINTS.MESSENGER.ORDERS, {
      page_id:    selectedPage.page_id,
      package_id: selectedPkg.id,
    });
    if (result.success) {
      toast.success(t.successOrder);
      navigate("/dashboard", { replace: true });
    } else {
      toast.error(result.error || t.failOrder);
    }
  };

  if (pkgsLoading && pagesLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Loader fullScreen text={t.loading} />
      </div>
    );
  }

  // Step slide direction respects RTL
  const enterX  = isRTL ? -40 : 40;
  const exitX   = isRTL ? 40  : -40;

  return (
    <div className="min-h-screen bg-[var(--background)]"
      style={{ backgroundImage: "radial-gradient(ellipse 100% 40% at 50% 0%, oklch(0.88 0.12 138 / 15%), transparent)" }}>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{t.subtitle}</p>
        </motion.div>

        {/* Step bar */}
        <motion.div {...fadeUp(0.05)}>
          <StepBar current={step} t={t} />
        </motion.div>

        {/* Steps */}
        <AnimatePresence mode="wait">

          {/* ── Step 1: Packages ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: enterX }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: exitX }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <SectionCard icon={Package} title={t.packages}>
                <div className="p-4">
                  {pkgsLoading ? <Loader text={t.loading} />
                    : pkgsError ? <EmptyState icon={Package} title={t.failPackages} description={pkgsError} />
                    : packages.length === 0 ? <EmptyState icon={Package} title={t.noPackages} description={t.noPackagesSub} />
                    : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {packages.map((pkg, i) => (
                          <PackageCard key={pkg.id} pkg={pkg} selected={selectedPkg?.id === pkg.id}
                            onSelect={setSelectedPkg} delay={i * 0.04} />
                        ))}
                      </div>
                    )}
                </div>
              </SectionCard>
              <div className="flex justify-end mt-4">
                <NavBtn onClick={() => setStep(2)} disabled={!selectedPkg} primary isRTL={isRTL}>{t.nextPage}</NavBtn>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Pages ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: enterX }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: exitX }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <SectionCard icon={LayoutList} title={t.pages}>
                <div className="p-4 space-y-2">
                  {pagesLoading ? <Loader text={t.loading} />
                    : pagesError ? <EmptyState icon={LayoutList} title={t.failPages} description={pagesError} />
                    : pages.length === 0 ? <EmptyState icon={LayoutList} title={t.noPages} description={t.noPagesSub} />
                    : pages.map((page, i) => (
                        <PageItem key={page.page_id} page={page}
                          selected={selectedPage?.page_id === page.page_id}
                          onSelect={setSelectedPageOverride} delay={i * 0.04} />
                      ))}
                </div>
              </SectionCard>
              <div className="flex justify-between mt-4">
                <NavBtn onClick={() => setStep(1)} isRTL={isRTL}>{t.back}</NavBtn>
                <NavBtn onClick={() => setStep(3)} disabled={!selectedPage} primary isRTL={isRTL}>{t.nextReview}</NavBtn>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: enterX }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: exitX }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <SectionCard icon={ShoppingCart} title={t.summary}>
                <div className="px-5">
                  {/* Package */}
                  <div className="py-4 border-b border-[var(--border)]">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">{t.packageSection}</p>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
                        <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--foreground)]">{selectedPkg?.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {selectedPkg?.msg_number?.toLocaleString()} {t.messages} · {selectedPkg?.months} {selectedPkg?.months === 1 ? t.months : t.monthsP}
                        </p>
                        <p className="text-sm font-bold text-[var(--primary)] mt-1">{selectedPkg?.price}</p>
                      </div>
                    </div>
                  </div>
                  {/* Page */}
                  <div className="py-4">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">{t.pageSection}</p>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: "oklch(0.60 0.18 264)" }}>
                        {selectedPage?.page_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--foreground)]">{selectedPage?.page_name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{selectedPage?.page_category}</p>
                        <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] font-mono mt-1">
                          <Hash className="w-3 h-3" aria-hidden="true" />{selectedPage?.page_id}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Notice */}
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    {t.notice}
                  </div>
                </div>
              </SectionCard>
              <div className="flex justify-between mt-4">
                <NavBtn onClick={() => setStep(2)} isRTL={isRTL}>{t.back}</NavBtn>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-[var(--primary-foreground)]
                    transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                    shadow-md shadow-[var(--primary)]/20"
                  style={{ background: "var(--primary)" }}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />{t.placing}</>
                    : <><ShoppingCart className="w-4 h-4" aria-hidden="true" />{t.confirmOrder}</>}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
