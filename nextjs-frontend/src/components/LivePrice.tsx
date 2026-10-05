"use client";

import { cn } from "cn";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

/** Price that flashes green/red and shows a trend arrow when it changes. */
export function LivePrice(props: { price: number; className?: string }) {
  const { price } = props;
  const [previous, setPrevious] = useState(price);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  if (price !== previous) {
    setDirection(price > previous ? "up" : "down");
    setPrevious(price);
  }

  return (
    <span
      key={price}
      className={cn(
        "num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 -mx-1.5",
        direction === "up" && "animate-flash-up",
        direction === "down" && "animate-flash-down",
        props.className,
      )}
    >
      {formatCurrency(price)}
      {direction === "up" && (
        <ArrowUpRight className="size-[0.9em] text-buy" aria-label="subiu" />
      )}
      {direction === "down" && (
        <ArrowDownRight className="size-[0.9em] text-sell" aria-label="caiu" />
      )}
    </span>
  );
}
