"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { socket } from "@/lib/socket-io";
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
  const color = isBuy ? "text-blue-700" : "text-red-700";
  const translatedType = isBuy ? "compra" : "venda";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { shares: 1, price: props.asset.price },
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`shares-${props.type}`} className={color}>
          Quantidade
        </Label>
        <Input
          id={`shares-${props.type}`}
          type="number"
          min={1}
          step={1}
          aria-invalid={!!errors.shares}
          {...register("shares", { valueAsNumber: true })}
        />
        {errors.shares && (
          <span className="text-sm text-destructive">
            {errors.shares.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`price-${props.type}`} className={color}>
          Preço R$
        </Label>
        <Input
          id={`price-${props.type}`}
          type="number"
          min={0.01}
          step={0.01}
          aria-invalid={!!errors.price}
          {...register("price", { valueAsNumber: true })}
        />
        {errors.price && (
          <span className="text-sm text-destructive">
            {errors.price.message}
          </span>
        )}
      </div>

      <Button
        type="submit"
        variant={isBuy ? "default" : "destructive"}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : `Confirmar ${translatedType}`}
      </Button>
    </form>
  );
}
