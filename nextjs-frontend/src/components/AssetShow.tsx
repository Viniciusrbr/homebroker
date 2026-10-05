import { cn } from "cn";
import Image from "next/image";
import type { Asset } from "@/models";

export function AssetShow(props: { asset: Asset; size?: "default" | "lg" }) {
  const { asset } = props;
  const isLarge = props.size === "lg";
  const imageSize = isLarge ? 40 : 24;

  return (
    <div className={cn("flex items-center", isLarge ? "gap-4" : "gap-3")}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-white ring-1 ring-border",
          isLarge ? "size-16" : "size-10",
        )}
      >
        <Image
          src={asset.image_url}
          alt={asset.symbol}
          width={imageSize}
          height={imageSize}
          className="object-contain"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate font-medium",
            isLarge ? "text-2xl tracking-tight" : "text-sm",
          )}
        >
          {asset.name}
        </span>
        <span className="num text-xs uppercase tracking-wider text-muted-foreground">
          {asset.symbol}
        </span>
      </div>
    </div>
  );
}
