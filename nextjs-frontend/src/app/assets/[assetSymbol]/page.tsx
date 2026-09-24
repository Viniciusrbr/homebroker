import { AssetShow } from "@/components/AssetShow";
import { OrderForm } from "@/components/OrderForm";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletList } from "@/components/WalletList";
import { type Asset, OrderType } from "@/models";
import { getAssetDailies, getMyWallet } from "@/queries/queries";
import { AssetChartComponent } from "./AssetChartComponent";
import { Time } from "lightweight-charts";

export async function getAsset(symbol: string): Promise<Asset> {
  const response = await fetch(`http://localhost:3000/assets/${symbol}`);
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

  return (
    <div className="flex flex-col space-y-5 grow">
      <div className="flex flex-col space-y-2">
        <AssetShow asset={asset} />
        <div className="ml-2 font-bold text-2xl">R$ {asset.price}</div>
      </div>
      <div className="grid grid-cols-5 grow gap-2">
        <div className="col-span-2">
          <Card>
            <CardContent>
              <Tabs defaultValue={OrderType.BUY}>
                <TabsList className="w-full">
                  <TabsTrigger value={OrderType.BUY} className="text-blue-700">
                    Comprar
                  </TabsTrigger>
                  <TabsTrigger value={OrderType.SELL} className="text-red-700">
                    Venda
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
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 flex grow">
          <AssetChartComponent asset={asset} data={chartData} />
        </div>
      </div>
    </div>
  );
}
