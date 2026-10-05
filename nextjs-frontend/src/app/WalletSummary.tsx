"use client";

import { formatCurrency, formatNumber } from "@/lib/utils";
import type { WalletAsset } from "@/models";
import { useAssetStore } from "@/store";

/** Headline stats for the wallet, recalculated as live prices arrive. */
export function WalletSummary(props: { walletAssets: WalletAsset[] }) {
  const liveAssets = useAssetStore((state) => state.assets);

  const total = props.walletAssets.reduce((sum, walletAsset) => {
    const live = liveAssets.find((a) => a.symbol === walletAsset.asset.symbol);
    return sum + (live ?? walletAsset.asset).price * walletAsset.shares;
  }, 0);
  const shares = props.walletAssets.reduce((sum, wa) => sum + wa.shares, 0);

  const stats = [
    { label: "Patrimônio", value: formatCurrency(total), highlight: true },
    { label: "Ativos", value: formatNumber(props.walletAssets.length) },
    { label: "Ações", value: formatNumber(shares) },
  ];

  return (
    <dl className="grid animate-rise-in grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border [animation-delay:40ms] sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-1.5 bg-card/90 px-5 py-4 first:col-span-2 sm:first:col-span-1"
        >
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            {stat.label}
          </dt>
          <dd
            className={
              stat.highlight
                ? "num text-2xl font-semibold text-primary sm:text-3xl"
                : "num text-2xl font-semibold sm:text-3xl"
            }
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
