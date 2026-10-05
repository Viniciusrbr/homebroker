import { AssetsSync } from "@/components/AssetsSync";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Panel } from "@/components/Panel";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { getMyWallet } from "@/queries/queries";
import { TableWalletAssetRow } from "./TableWalletAssetRow";
import { WalletSummary } from "./WalletSummary";

export default async function MyWalletListPage({
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

  return (
    <div className="flex grow flex-col gap-8">
      <PageHeader
        eyebrow="Visão geral"
        title="Minha carteira"
        description="Suas posições com cotações atualizadas em tempo real."
      />

      <WalletSummary walletAssets={wallet.assets} />

      <Panel>
        {wallet.assets.length === 0 ? (
          <EmptyState
            title="Carteira vazia"
            description="Vá até Ativos para fazer sua primeira compra."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Cotação</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Posição</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.assets.map((walletAsset) => (
                <TableWalletAssetRow
                  key={walletAsset.asset._id}
                  walletAsset={walletAsset}
                  walletId={wallet_id}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <AssetsSync
        assetsSymbols={wallet.assets.map(
          (walletAsset) => walletAsset.asset.symbol,
        )}
      />
    </div>
  );
}
