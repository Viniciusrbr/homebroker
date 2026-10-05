import { cn } from "cn";
import type React from "react";

/** Bordered surface used to frame tables and dashboards. */
export function Panel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "animate-rise-in overflow-hidden rounded-2xl border bg-card/70 shadow-[0_1px_0_0_oklch(1_0_0/4%)_inset] backdrop-blur-sm [animation-delay:80ms]",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState(props: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-16 text-center">
      <p className="font-display text-2xl">{props.title}</p>
      <p className="text-sm text-muted-foreground">{props.description}</p>
    </div>
  );
}
