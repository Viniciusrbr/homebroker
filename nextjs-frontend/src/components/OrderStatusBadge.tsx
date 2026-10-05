import { cn } from "cn";
import { OrderStatus } from "../models";
import { Badge } from "./ui/badge";

const statusConfig: Record<OrderStatus, { dot: string; label: string }> = {
  [OrderStatus.PENDING]: {
    dot: "bg-warning animate-pulse-dot",
    label: "Pendente",
  },
  [OrderStatus.OPEN]: { dot: "bg-primary animate-pulse-dot", label: "Aberta" },
  [OrderStatus.CLOSED]: { dot: "bg-muted-foreground", label: "Executada" },
  [OrderStatus.FAILED]: { dot: "bg-sell", label: "Falhou" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { dot, label } = statusConfig[status];
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
