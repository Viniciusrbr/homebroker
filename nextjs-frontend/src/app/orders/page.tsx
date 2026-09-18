import { AssetShow } from "@/components/AssetShow";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderTypeBadge } from "@/components/OrderTypeBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { getMyWallet, getOrders } from "@/queries/queries";

export default async function OrdersListPage({
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

  const orders = await getOrders(wallet_id);
  console.log(orders);
  return (
    <div className="flex flex-col space-y-5 grow">
      <article className="format">
        <h1>Minhas ordens</h1>
      </article>
      <div className="overflow-x-auto w-full">
        <Table className="w-full max-w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, key) => (
              <TableRow key={key}>
                <TableCell>
                  <AssetShow asset={order.asset} />
                </TableCell>
                <TableCell>R$ {order.price}</TableCell>
                <TableCell>{order.shares}</TableCell>
                <TableCell>
                  <OrderTypeBadge type={order.type} />
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
