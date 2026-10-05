"use client";

import { cn } from "cn";
import { Menu, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Carteira" },
  { href: "/assets", label: "Ativos" },
  { href: "/orders", label: "Ordens" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletId = searchParams.get("wallet_id");
  const [open, setOpen] = useState(false);

  const withWallet = (href: string) =>
    walletId ? `${href}?wallet_id=${walletId}` : href;

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href={withWallet("/")}
          className="group flex items-center gap-2.5"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M3 17l5-5 4 4 8-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-2xl leading-none">
            Homebroker
            <span className="text-primary italic"> Invest</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 rounded-full border bg-card/60 p-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={withWallet(link.href)}
                className={cn(
                  "block rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive(pathname, link.href)
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {walletId ? (
            <span className="hidden items-center gap-2 rounded-full border bg-card/60 py-1 pr-3 pl-1.5 text-xs sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-secondary">
                <Wallet className="size-3.5 text-muted-foreground" />
              </span>
              <span className="num text-muted-foreground">
                {walletId.substring(0, 8)}
              </span>
              <span
                className="size-1.5 animate-pulse-dot rounded-full bg-buy"
                title="Conectado"
              />
            </span>
          ) : (
            <span className="hidden text-xs text-muted-foreground sm:block">
              Nenhuma carteira
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
      </div>

      {open && (
        <ul className="flex flex-col gap-1 border-t px-4 py-3 md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={withWallet(link.href)}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(pathname, link.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
