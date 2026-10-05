import { AssetShow } from "@/components/AssetShow";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderTypeBadge } from "@/components/OrderTypeBadge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Panel } from "@/components/Panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletList } from "@/components/WalletList";
import { formatCurrency, formatNumber } from "@/lib/utils";
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
  return (
    <div className="flex grow flex-col gap-8">
      <PageHeader
        eyebrow="Histórico"
        title="Minhas ordens"
        description="Acompanhe o status das suas ordens de compra e venda."
      />
      <Panel>
        {orders.length === 0 ? (
          <EmptyState
            title="Nenhuma ordem ainda"
            description="Suas ordens de compra e venda aparecerão aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <AssetShow asset={order.asset} />
                  </TableCell>
                  <TableCell>
                    <OrderTypeBadge type={order.type} />
                  </TableCell>
                  <TableCell className="num text-right">
                    {formatCurrency(order.price)}
                  </TableCell>
                  <TableCell className="num text-right">
                    {formatNumber(order.shares)}
                  </TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatCurrency(order.price * order.shares)}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
