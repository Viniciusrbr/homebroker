"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { socket } from "@/lib/socket-io";
import { formatCurrency } from "@/lib/utils";
import { type Asset, type Order, OrderType } from "@/models";
import { toast } from "./ui/toast";

const orderSchema = z.object({
  shares: z
    .number({ error: "Informe a quantidade" })
    .int("A quantidade deve ser um número inteiro")
    .min(1, "A quantidade mínima é 1"),
  price: z
    .number({ error: "Informe o preço" })
    .positive("O preço deve ser maior que zero"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm(props: {
  asset: Asset;
  walletId: string;
  type: OrderType;
}) {
  const isBuy = props.type === OrderType.BUY;
  const translatedType = isBuy ? "compra" : "venda";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { shares: 1, price: props.asset.price },
  });

  // useWatch instead of watch(): stays reactive under the React Compiler
  const [shares, price] = useWatch({ control, name: ["shares", "price"] });
  const total =
    Number.isFinite(shares) && Number.isFinite(price) ? shares * price : 0;

  async function onSubmit(values: OrderFormValues) {
    if (!socket.connected) {
      socket.connect();
    }

    try {
      const newOrder: Order = await socket
        .timeout(5000)
        .emitWithAck("orders/create", {
          assetId: props.asset._id,
          walletId: props.walletId,
          type: props.type,
          ...values,
        });
      toast.add({
        type: "success",
        title: "Ordem criada",
        description: `Ordem de ${translatedType} de ${newOrder.shares} ações de ${props.asset.symbol} criada com sucesso`,
      });
    } catch {
      toast.add({
        type: "error",
        title: "Erro ao criar ordem",
        description: `Não foi possível criar a ordem de ${translatedType}. Tente novamente.`,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor={`shares-${props.type}`}
          className="text-xs uppercase tracking-wider text-muted-foreground"
        >
          Quantidade
        </Label>
        <Input
          id={`shares-${props.type}`}
          type="number"
          min={1}
          step={1}
          className="num h-11 rounded-xl text-base"
          aria-invalid={!!errors.shares}
          {...register("shares", { valueAsNumber: true })}
        />
        {errors.shares && (
          <span className="text-xs text-destructive">
            {errors.shares.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor={`price-${props.type}`}
          className="text-xs uppercase tracking-wider text-muted-foreground"
        >
          Preço limite
        </Label>
        <div className="relative">
          <span className="num pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id={`price-${props.type}`}
            type="number"
            min={0.01}
            step={0.01}
            className="num h-11 rounded-xl pl-10 text-base"
            aria-invalid={!!errors.price}
            {...register("price", { valueAsNumber: true })}
          />
        </div>
        {errors.price && (
          <span className="text-xs text-destructive">
            {errors.price.message}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between border-t border-dashed pt-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Total estimado
        </span>
        <span className="num text-xl font-semibold">
          {formatCurrency(total)}
        </span>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className={cn(
          "h-12 rounded-xl text-base font-semibold",
          isBuy
            ? "bg-buy text-buy-foreground hover:bg-buy/85"
            : "bg-sell text-sell-foreground hover:bg-sell/85",
        )}
      >
        {isSubmitting
          ? "Enviando..."
          : `${isBuy ? "Comprar" : "Vender"} ${props.asset.symbol}`}
      </Button>
    </form>
  );
}
