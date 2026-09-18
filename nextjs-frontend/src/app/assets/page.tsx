import { AssetShow } from "@/components/AssetShow";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { getAssets, getMyWallet } from "@/queries/queries";

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
    <div className="flex flex-col space-y-5 grow">
      <article className="format">
        <h1>Ativos</h1>
      </article>
      <div className="overflow-x-auto w-full">
        <Table className="w-full max-w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Cotação</TableHead>
              <TableHead>Comprar/vender</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset, key) => (
              <TableRow key={key}>
                <TableCell>
                  <AssetShow asset={asset} />
                </TableCell>
                <TableCell>R$ {asset.price}</TableCell>
                <TableCell>
                  <Button>Comprar/vender</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
