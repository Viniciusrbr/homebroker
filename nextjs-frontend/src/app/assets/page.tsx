import { AssetsSync } from "@/components/AssetsSync";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { getAssets, getMyWallet } from "@/queries/queries";
import { TableAssetRow } from "./TableAssetRow";

export default async function AssetsListPage({
  searchParams,
}: {
  searchParams: Promise<{ wallet_id: string }>;
}) {
  const { wallet_id } = await searchParams;

  if (!wallet_id) {
    return <WalletList />;
  }

  const wallet = await getMyWallet(wallet_id);

  if (!wallet) {
    return <WalletList />;
  }

  const assets = await getAssets();

  return (
    <div className="flex grow flex-col gap-8">
      <PageHeader
        eyebrow="Mercado"
        title="Ativos"
        description={`${assets.length} ativos disponíveis para negociação. Cotações ao vivo.`}
      />
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Cotação</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableAssetRow
                key={asset._id}
                asset={asset}
                walletId={wallet_id}
              />
            ))}
          </TableBody>
        </Table>
      </Panel>
      <AssetsSync assetsSymbols={assets.map((asset) => asset.symbol)} />
    </div>
  );
}
