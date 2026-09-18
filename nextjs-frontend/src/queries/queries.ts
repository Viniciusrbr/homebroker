import type { Asset, AssetDaily, Order, Wallet } from "@/models";

export async function getAssets(): Promise<Asset[]> {
  const response = await fetch(`http://localhost:3000/assets`);
  return response.json();
}

export async function getWallets(): Promise<Wallet[]> {
  const response = await fetch(`http://localhost:3000/wallets`);
  return response.json();
}

export async function getMyWallet(walletId: string): Promise<Wallet | null> {
  const response = await fetch(`http://localhost:3000/wallets/${walletId}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getOrders(walletId: string): Promise<Order[]> {
  const response = await fetch(
    `http://localhost:3000/orders?walletId=${walletId}`,
  );
  return response.json();
}

export async function getAssetDailies(
  assetSymbol: string,
): Promise<AssetDaily[]> {
  const response = await fetch(
    `http://localhost:3000/assets/${assetSymbol}/dailies`,
  );
  return response.json();
}
