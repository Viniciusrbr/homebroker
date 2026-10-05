import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Panel } from "@/components/Panel";
import { getWallets } from "@/queries/queries";

export async function WalletList() {
  const wallets = await getWallets();

  return (
    <div className="flex grow flex-col gap-8">
      <PageHeader
        eyebrow="Acesso"
        title="Escolha uma carteira"
        description="Nenhuma carteira selecionada. Selecione uma das carteiras abaixo para começar a negociar."
      />

      {wallets.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nenhuma carteira encontrada"
            description="Crie uma carteira pela API para continuar."
          />
        </Panel>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet, index) => (
            <li
              key={wallet._id}
              className="animate-rise-in"
              style={{ animationDelay: `${60 + index * 40}ms` }}
            >
              <Link
                href={`/?wallet_id=${wallet._id}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Wallet className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">
                    Carteira {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="num truncate text-xs text-muted-foreground">
                    {wallet._id}
                  </span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
