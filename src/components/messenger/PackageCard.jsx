import { motion } from "framer-motion";
import { MessageSquare, Check } from "lucide-react";

/**
 * Displays one Facebook Messenger package.
 * Props: package data + selected boolean + onSelect callback.
 */
export default function PackageCard({ pkg, selected, onSelect, delay = 0 }) {
  const hasDiscount = pkg.discount && Number(pkg.discount.amount) > 0;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(pkg)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay }}
      className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
        ${selected
          ? "border-[var(--primary)] bg-[var(--accent)] shadow-md shadow-[var(--primary)]/10"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:shadow-sm"
        }`}
      aria-pressed={selected}
    >
      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
          <Check className="w-3 h-3 text-white" aria-hidden="true" />
        </span>
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: selected ? "var(--primary)" : "oklch(0.95 0.04 138)" }}
      >
        <MessageSquare
          className={`w-4 h-4 ${selected ? "text-white" : "text-[var(--primary)]"}`}
          aria-hidden="true"
        />
      </div>

      {/* Name */}
      <p className="font-semibold text-sm text-[var(--foreground)] leading-tight mb-1">
        {pkg.name ?? `Package #${pkg.id}`}
      </p>

      {/* Messages */}
      <p className="text-xs text-[var(--muted-foreground)] mb-3">
        {pkg.msg_number?.toLocaleString()} messages · {pkg.months} month{pkg.months !== 1 ? "s" : ""}
      </p>

      {/* Price row */}
      <div className="flex items-end gap-2">
        <span className="text-lg font-bold text-[var(--foreground)]">{pkg.price}</span>
        {hasDiscount && (
          <span className="text-xs text-green-600 font-medium mb-0.5">
            -{pkg.discount.amount}
            {pkg.discount.type === "percentage" ? "%" : ""}
          </span>
        )}
      </div>

      {/* Tax note */}
      {pkg.tax && (
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          + {pkg.tax.amount} {pkg.tax.type === "percentage" ? "%" : ""} {pkg.tax.name}
        </p>
      )}
    </motion.button>
  );
}
