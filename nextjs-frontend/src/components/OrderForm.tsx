import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Asset, OrderType } from "@/models";

export function OrderForm(props: {
  asset: Asset;
  walletId: string;
  type: OrderType;
}) {
  const isBuy = props.type === OrderType.BUY;
  const color = isBuy ? "text-blue-700" : "text-red-700";
  const translatedType = isBuy ? "compra" : "venda";

  return (
    <form className="flex flex-col gap-4">
      <input type="hidden" name="assetId" defaultValue={props.asset._id} />
      <input type="hidden" name="walletId" defaultValue={props.walletId} />
      <input type="hidden" name="type" defaultValue={props.type} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`shares-${props.type}`} className={color}>
          Quantidade
        </Label>
        <Input
          id={`shares-${props.type}`}
          name="shares"
          required
          type="number"
          min={1}
          step={1}
          defaultValue={1}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`price-${props.type}`} className={color}>
          Preço R$
        </Label>
        <Input
          id={`price-${props.type}`}
          name="price"
          required
          type="number"
          min={1}
          step={1}
          defaultValue={1}
        />
      </div>

      <Button type="submit" variant={isBuy ? "default" : "destructive"}>
        Confirmar {translatedType}
      </Button>
    </form>
  );
}
