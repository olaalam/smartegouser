import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import Navbar from "../components/layout/Navbar";
import WhatsAppNumbersStep from "../components/whatsapp/WhatsAppNumbersStep";
import WhatsAppPackageStep from "../components/whatsapp/WhatsAppPackageStep";
import WhatsAppStepBar from "../components/whatsapp/WhatsAppStepBar";
import WhatsAppVerificationStep from "../components/whatsapp/WhatsAppVerificationStep";
import T from "./whatsAppTranslations";

function StepNavigation({ step, setStep, canContinue, isRTL, t }) {
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex justify-between border-t border-[var(--border)] pt-5">
      {step > 1 ? (
        <button type="button" onClick={() => setStep(step - 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">
          <BackIcon className="h-4 w-4" aria-hidden="true" />{t.back}
        </button>
      ) : <span />}
      {step < 3 && (
        <button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          {t.next}<NextIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function WhatsAppWizard() {
  const [searchParams] = useSearchParams();
  const lang = useSelector((state) => state.ui.lang);
  const t = T[lang] ?? T.en;
  const isRTL = lang === "ar";
  const [step, setStep] = useState(null);
  const [autoRequestPhone, setAutoRequestPhone] = useState("");
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.WHATSAPP.ITEMS);
  const items = data?.data ?? [];
  const hasVerifiedNumber = items.some((item) => Boolean(item.phone_verified_at));
  const requestedPackageStep = searchParams.get("step") === "package";
  const currentStep = step ?? (requestedPackageStep && hasVerifiedNumber ? 3 : 1);
  const steps = [t.steps.numbers, t.steps.verification, t.steps.package];
  const handleCreated = (phone, autoRequestCode) => {
    setAutoRequestPhone(autoRequestCode ? phone : "");
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-7">
          <WhatsAppStepBar current={currentStep} steps={steps} />

          <div className="mt-7">
            <AnimatePresence mode="wait">
              <motion.section key={currentStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                {currentStep === 1 && <WhatsAppNumbersStep items={items} loading={loading} error={error} refetch={refetch}
                  lang={lang} isRTL={isRTL} t={t.numbers} onCreated={handleCreated} />}
                {currentStep === 2 && <WhatsAppVerificationStep items={items} loading={loading} error={error} refetch={refetch}
                  lang={lang} t={t.verification} autoRequestPhone={autoRequestPhone} />}
                {currentStep === 3 && <WhatsAppPackageStep items={items} lang={lang} t={t.package} />}
                <StepNavigation step={currentStep} setStep={setStep}
                  canContinue={currentStep === 1 ? items.length > 0 : hasVerifiedNumber}
                  isRTL={isRTL} t={t.common} />
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}