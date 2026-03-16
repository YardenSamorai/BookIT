export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: "before" | "after";
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪", symbolPosition: "before" },
  { code: "USD", name: "US Dollar", symbol: "$", symbolPosition: "before" },
  { code: "EUR", name: "Euro", symbol: "€", symbolPosition: "before" },
  { code: "GBP", name: "British Pound", symbol: "£", symbolPosition: "before" },
];

export function getCurrency(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

export function formatPrice(amount: number | string, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) return `${amount}`;

  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = numericAmount.toFixed(2);

  if (currency.symbolPosition === "before") {
    return `${currency.symbol}${formatted}`;
  }
  return `${formatted}${currency.symbol}`;
}
