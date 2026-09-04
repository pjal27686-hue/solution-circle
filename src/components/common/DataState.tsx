import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DataStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}

export function DataState<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
  loadingLabel = "Loading…",
  emptyTitle = "Nothing here yet",
  emptyDescription = "There is no data to display for the current filters.",
  emptyAction,
  onRetry,
  skeletonRows = 3,
  children,
}: DataStateProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingLabel}
        </p>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="mx-auto size-6 text-destructive" aria-hidden />
        <h3 className="mt-3 text-base font-semibold">Unable to load this data</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "The request failed. Please try again."}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty?.(data)) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card/50 p-10 text-center">
        <Inbox className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <h3 className="mt-3 text-base font-semibold">{emptyTitle}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
        {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
      </div>
    );
  }

  return <>{children(data)}</>;
}
