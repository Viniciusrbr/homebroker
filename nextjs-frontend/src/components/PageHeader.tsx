import type React from "react";

export function PageHeader(props: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex animate-rise-in flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <span className="num text-xs uppercase tracking-[0.2em] text-primary">
          {props.eyebrow}
        </span>
        <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">
          {props.title}
        </h1>
        {props.description && (
          <p className="max-w-xl text-sm text-muted-foreground">
            {props.description}
          </p>
        )}
      </div>
      {props.actions}
    </header>
  );
}
