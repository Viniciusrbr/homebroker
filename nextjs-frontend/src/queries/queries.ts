import type { Asset, AssetDaily, Order, Wallet } from "@/models";

// no Docker o servidor do Next acessa a API via host.docker.internal
export const API_URL = process.env.API_URL ?? "http://localhost:3000";

export async function getAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_URL}/assets`);
  return response.json();
}

export async function getWallets(): Promise<Wallet[]> {
  const response = await fetch(`${API_URL}/wallets`);
  return response.json();
}

export async function getMyWallet(walletId: string): Promise<Wallet | null> {
  const response = await fetch(`${API_URL}/wallets/${walletId}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getOrders(walletId: string): Promise<Order[]> {
  const response = await fetch(
    `${API_URL}/orders?walletId=${walletId}`,
  );
  return response.json();
}

export async function getAssetDailies(
  assetSymbol: string,
): Promise<AssetDaily[]> {
  const response = await fetch(
    `${API_URL}/assets/${assetSymbol}/dailies`,
  );
  return response.json();
}
