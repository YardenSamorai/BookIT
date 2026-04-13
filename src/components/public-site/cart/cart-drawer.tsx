"use client";

import { useEffect, useRef } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { t, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/currencies";

interface CartDrawerProps {
  locale: Locale;
  currency: string;
  accentColor: string;
  businessId: string;
}

export function CartDrawer({ locale, currency, accentColor, businessId }: CartDrawerProps) {
  const { items, totalItems, totalPrice, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCart();
  const backdropRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "he";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedTotal = formatPrice(totalPrice.toFixed(2), currency);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`absolute top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in duration-300 ${
          isRtl ? "start-0 slide-in-from-right" : "end-0 slide-in-from-right"
        }`}
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-5" style={{ color: accentColor }} />
            <h2 className="text-lg font-bold text-gray-900">
              {t(locale, "cart.title" as never)}
            </h2>
            {totalItems > 0 && (
              <span
                className="flex size-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="size-9 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">{t(locale, "cart.empty" as never)}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                >
                  {/* Image */}
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-300">
                        {item.title.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm font-bold mt-0.5" style={{ color: accentColor }}>
                      {formatPrice(item.price.toFixed(2), currency)}
                    </p>

                    {/* Qty controls */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-0 rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex size-8 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex size-8 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 1 && (
              <button
                onClick={clearCart}
                className="mt-4 w-full text-center text-xs font-medium text-gray-400 transition-colors hover:text-red-500"
              >
                {t(locale, "cart.clear_all" as never)}
              </button>
            )}
          </div>
        )}

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="border-t bg-white px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t(locale, "cart.total" as never)}</span>
              <span className="text-xl font-black text-gray-900">{formattedTotal}</span>
            </div>

            <button
              onClick={() => {
                const msg = items
                  .map((i) => `${i.title} x${i.quantity} — ${formatPrice((i.price * i.quantity).toFixed(2), currency)}`)
                  .join("\n");
                const total = `\n\n${t(locale, "cart.total" as never)}: ${formattedTotal}`;
                const encoded = encodeURIComponent(
                  `${t(locale, "cart.order_message" as never)}\n\n${msg}${total}`
                );

                const whatsappEl = document.querySelector<HTMLAnchorElement>('a[href*="wa.me"]');
                const phone = whatsappEl?.href?.match(/wa\.me\/(\d+)/)?.[1];

                if (phone) {
                  window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
                } else {
                  navigator.clipboard.writeText(`${msg}${total}`).then(() => {
                    alert(t(locale, "cart.copied" as never));
                  });
                }

                clearCart();
              }}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
            >
              {t(locale, "cart.confirm_order" as never)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
