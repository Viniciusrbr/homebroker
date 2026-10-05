import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TradeLink(props: { symbol: string; walletId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      className="group/trade hover:border-primary/50 hover:text-primary"
      render={
        <Link href={`/assets/${props.symbol}?wallet_id=${props.walletId}`} />
      }
    >
      Negociar
      <ArrowRight
        data-icon="inline-end"
        className="transition-transform group-hover/trade:translate-x-0.5"
      />
    </Button>
  );
}
