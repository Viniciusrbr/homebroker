import { cn } from "cn";
import { OrderType } from "../models";
import { Badge } from "./ui/badge";

export function OrderTypeBadge({ type }: { type: OrderType }) {
  const isBuy = type === OrderType.BUY;
  return (
    <Badge
      className={cn(
        "num uppercase tracking-wider",
        isBuy ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell",
      )}
    >
      {isBuy ? "Compra" : "Venda"}
    </Badge>
  );
}
