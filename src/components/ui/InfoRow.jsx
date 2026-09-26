/**
 * A single label / value row used inside SectionCard.
 * `label` and `children` accept strings or JSX nodes.
 */
export default function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)] shrink-0">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)] text-end">{children ?? "—"}</span>
    </div>
  );
}
