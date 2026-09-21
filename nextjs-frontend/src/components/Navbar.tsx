"use client";

import { cn } from "cn";
import { Menu, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Carteira" },
  { href: "/assets", label: "Ativos" },
  { href: "/orders", label: "Ordens" },
];

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletId = searchParams.get("wallet_id");
  const [open, setOpen] = useState(false);

  const withWallet = (href: string) =>
    walletId ? `${href}?wallet_id=${walletId}` : href;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between p-4">
        <Link href={withWallet("/")} className="flex items-center gap-3">
          <TrendingUp className="size-7 text-primary" />
          <span className="text-xl font-semibold">Homebroker Invest</span>
        </Link>

        <div className="flex items-center gap-2 md:order-2">
          {walletId && (
            <span className="text-sm text-muted-foreground">
              Olá {walletId.substring(0, 5)}...
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>

        <div
          className={cn(
            "w-full md:flex md:w-auto md:items-center",
            open ? "block" : "hidden",
          )}
        >
          <ul className="mt-4 flex flex-col gap-1 md:mt-0 md:flex-row md:gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <Button
                  variant="link"
                  nativeButton={false}
                  className={cn(
                    "text-xl",
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  render={<Link href={withWallet(link.href)} />}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
