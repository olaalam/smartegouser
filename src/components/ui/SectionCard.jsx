/**
 * Reusable white card with an optional header row (icon + title + right slot).
 */
export default function SectionCard({ icon: Icon, iconBg, title, action, children, className = "" }) {
  return (
    <div className={`bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden ${className}`}>
      {(Icon || title || action) && (
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: iconBg ?? "oklch(0.95 0.04 138)" }}
              >
                <Icon className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
              </div>
            )}
            {title && (
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
