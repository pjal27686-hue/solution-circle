import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden />}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function FactorBar({
  label,
  detail,
  valuePct,
  weightPct,
}: {
  label: string;
  detail: string;
  valuePct: number;
  weightPct: number;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          weight {weightPct}% · {valuePct.toFixed(0)}%
        </p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, valuePct)}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
