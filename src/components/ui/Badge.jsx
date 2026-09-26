/**
 * Small status / label badge.
 * variant: "default" | "success" | "warning" | "danger" | "info"
 */
const styles = {
  default: "bg-[oklch(0.95_0.04_138)] text-[var(--primary)]",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger:  "bg-red-100 text-red-600",
  info:    "bg-blue-100 text-blue-700",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant] ?? styles.default} ${className}`}
    >
      {children}
    </span>
  );
}
