import { AssetShow } from "@/components/AssetShow";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { getMyWallet } from "@/queries/queries";


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
    <div className="flex flex-col space-y-5 grow">
      <article className="format">
        <h1>Minha carteira</h1>
      </article>

      <div className="overflow-x-auto w-full">
        <Table>
          <TableCaption>Detalhes da sua carteira</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Cotação</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Comprar/vender</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              wallet.assets.map((walletAsset, key) => (
                <TableRow key={key}>
                  <TableCell>
                    <AssetShow asset={walletAsset.asset} />
                  </TableCell>
                  <TableCell>R$ {walletAsset.asset.price}</TableCell>
                  <TableCell>{walletAsset.shares}</TableCell>
                  <TableCell>
                    <Button
                    >
                      Comprar/vender
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
