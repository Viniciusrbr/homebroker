import type { VariantProps } from "class-variance-authority";
import { OrderStatus } from "../models";
import { Badge, type badgeVariants } from "./ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const statusConfig: Record<
  OrderStatus,
  { variant: BadgeVariant; label: string }
> = {
  [OrderStatus.PENDING]: { variant: "secondary", label: "Pendente" },
  [OrderStatus.OPEN]: { variant: "default", label: "Aberto" },
  [OrderStatus.CLOSED]: { variant: "outline", label: "Fechado" },
  [OrderStatus.FAILED]: { variant: "destructive", label: "Falhou" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { variant, label } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
