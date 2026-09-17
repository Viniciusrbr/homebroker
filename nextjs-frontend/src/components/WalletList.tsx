import Link from "next/link";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWallets } from "@/queries/queries";

export async function WalletList() {
  const wallets = await getWallets();

  return (
    <div className="flex flex-col space-y-5 grow">
      <Alert variant="destructive">
        <AlertTitle>Nenhuma wallet escolhida</AlertTitle>
      </Alert>

      <article className="format">
        <h1>Carteiras existentes</h1>
      </article>

      <div className="overflow-x-auto w-full">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Acessar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet._id}>
                <TableCell>{wallet._id}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    nativeButton={false}
                    render={<Link href={`/?wallet_id=${wallet._id}`} />}
                  >
                    Acessar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
