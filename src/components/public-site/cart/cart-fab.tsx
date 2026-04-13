"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";

interface CartFabProps {
  accentColor: string;
}

export function CartFab({ accentColor }: CartFabProps) {
  const { totalItems, openCart } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={openCart}
      className="fixed bottom-20 end-4 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 animate-in zoom-in-50 duration-300"
      style={{ backgroundColor: accentColor }}
    >
      <ShoppingBag className="size-5" />
      <span className="text-sm font-bold">{totalItems}</span>
    </button>
  );
}
