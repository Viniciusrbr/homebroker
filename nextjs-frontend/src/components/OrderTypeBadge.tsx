import { OrderType } from "../models";
import { Badge } from "./ui/badge";

export function OrderTypeBadge({ type }: { type: OrderType }) {
  const isBuy = type === OrderType.BUY;
  return (
    <Badge variant={isBuy ? "default" : "destructive"}>
      {isBuy ? "Compra" : "Venda"}
    </Badge>
  );
}
