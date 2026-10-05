export { cn } from "cn";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const integer = new Intl.NumberFormat("pt-BR");

export function formatCurrency(value: number) {
  return brl.format(value);
}

export function formatNumber(value: number) {
  return integer.format(value);
}
