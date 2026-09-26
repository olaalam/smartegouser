import { motion } from "framer-motion";
import { Check, Link2, Link2Off } from "lucide-react";
import Badge from "../ui/Badge";

/**
 * One Facebook page row inside the page selection list.
 */
export default function PageItem({ page, selected, onSelect, delay = 0 }) {
  const isLinked = page.already_linked === "yes" || page.already_linked === true;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(page)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
        ${selected
          ? "border-[var(--primary)] bg-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"
        }`}
      aria-pressed={selected}
    >
      {/* Avatar placeholder */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: selected ? "var(--primary)" : "oklch(0.85 0.08 264)" }}
      >
        {page.page_name?.charAt(0)?.toUpperCase() ?? "P"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{page.page_name}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate">
          {page.page_category} · <span className="font-mono">{page.page_id}</span>
        </p>
      </div>

      {/* Linked status badge */}
      <div className="shrink-0 flex items-center gap-2">
        {isLinked ? (
          <Badge variant="success">
            <Link2 className="w-3 h-3" aria-hidden="true" /> Linked
          </Badge>
        ) : (
          <Badge variant="info">
            <Link2Off className="w-3 h-3" aria-hidden="true" /> Not linked
          </Badge>
        )}

        {/* Selected indicator */}
        {selected && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Check className="w-3 h-3 text-white" aria-hidden="true" />
          </span>
        )}
      </div>
    </motion.button>
  );
}
