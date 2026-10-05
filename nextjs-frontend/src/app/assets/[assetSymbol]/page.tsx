import type { Time } from "lightweight-charts";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AssetShow } from "@/components/AssetShow";
import { AssetsSync } from "@/components/AssetsSync";
import { OrderForm } from "@/components/OrderForm";
import { Panel } from "@/components/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletList } from "@/components/WalletList";
import { type Asset, OrderType } from "@/models";
import { API_URL, getAssetDailies, getMyWallet } from "@/queries/queries";
import { AssetChartComponent } from "./AssetChartComponent";
import { AssetPrice } from "./AssetPrice";

export async function getAsset(symbol: string): Promise<Asset> {
  const response = await fetch(`${API_URL}/assets/${symbol}`);
  return response.json();
}

export default async function AssetDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ assetSymbol: string }>;
  searchParams: Promise<{ wallet_id: string }>;
}) {
  const { assetSymbol } = await params;
  const { wallet_id: walletId } = await searchParams;

  if (!walletId) {
    return <WalletList />;
  }

  const wallet = await getMyWallet(walletId);

  if (!wallet) {
    return <WalletList />;
  }

  const asset = await getAsset(assetSymbol);
  const assetDailies = await getAssetDailies(assetSymbol);
  const chartData = assetDailies.map((assetDaily) => ({
    time: (Date.parse(assetDaily.date) / 1000) as Time,
    value: assetDaily.price,
  }));
  const position = wallet.assets.find(
    (walletAsset) => walletAsset.asset.symbol === asset.symbol,
  );

  return (
    <div className="flex grow flex-col gap-8">
      <div className="flex animate-rise-in flex-col gap-6">
        <Link
          href={`/assets?wallet_id=${walletId}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para ativos
        </Link>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <AssetShow asset={asset} size="lg" />
          <AssetPrice asset={asset} />
        </div>
      </div>

      <div className="grid grow gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="flex min-h-105 flex-col">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Histórico de preço
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-buy" />
              Ao vivo
            </span>
          </div>
          <div className="grow p-2">
            <AssetChartComponent asset={asset} data={chartData} />
          </div>
        </Panel>

        <Panel className="h-fit p-5">
          <Tabs defaultValue={OrderType.BUY} className="gap-5">
            <TabsList className="h-11! w-full rounded-xl p-1">
              <TabsTrigger
                value={OrderType.BUY}
                className="rounded-lg data-active:bg-buy! data-active:text-buy-foreground!"
              >
                Comprar
              </TabsTrigger>
              <TabsTrigger
                value={OrderType.SELL}
                className="rounded-lg data-active:bg-sell! data-active:text-sell-foreground!"
              >
                Vender
              </TabsTrigger>
            </TabsList>
            <TabsContent value={OrderType.BUY}>
              <OrderForm
                asset={asset}
                walletId={walletId}
                type={OrderType.BUY}
              />
            </TabsContent>
            <TabsContent value={OrderType.SELL}>
              <OrderForm
                asset={asset}
                walletId={walletId}
                type={OrderType.SELL}
              />
            </TabsContent>
          </Tabs>
          <p className="num mt-5 border-t pt-4 text-xs text-muted-foreground">
            Na carteira: {position?.shares ?? 0} {asset.symbol}
          </p>
        </Panel>
      </div>

      <AssetsSync assetsSymbols={[asset.symbol]} />
    </div>
  );
}
