import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppStepBar({ current, steps }) {
  return (
    <div className="mx-auto flex w-full max-w-lg items-center">
      {steps.map((step, index) => {
        const complete = current > index + 1;
        const active = current === index + 1;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                complete || active ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              } ${active ? "ring-4 ring-[var(--primary)]/20" : ""}`}>
                {complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </div>
              <span className={`whitespace-nowrap text-xs font-medium ${active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mb-4 mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div className="h-full rounded-full" style={{ background: "var(--primary)" }}
                  initial={false} animate={{ width: complete ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}