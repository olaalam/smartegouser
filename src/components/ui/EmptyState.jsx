/**
 * Generic empty / error placeholder.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[oklch(0.95_0.04_138)] flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-[var(--primary)]" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      {description && (
        <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
