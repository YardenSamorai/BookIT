"use client";

import type { InferSelectModel } from "drizzle-orm";
import type { services } from "@/lib/db/schema";
import { Clock, ChevronLeft, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils/currencies";
import { useT } from "@/lib/i18n/locale-context";

type Service = InferSelectModel<typeof services>;

interface StepServiceProps {
  services: Service[];
  selectedId: string;
  currency: string;
  secondaryColor: string;
  staffName?: string;
  onSelect: (id: string) => void;
  onBack?: () => void;
}

export function StepService({
  services: serviceList,
  selectedId,
  currency,
  secondaryColor,
  onSelect,
  onBack,
}: StepServiceProps) {
  const t = useT();

  return (
    <div className="flex flex-1 flex-col">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="size-4" />
          {t("book.change_professional")}
        </button>
      )}

      <h2 className="text-lg font-bold text-gray-900">
        {t("book.choose_service")}
      </h2>
      <p className="mt-1 text-xs text-gray-400">
        {t("book.select_service")}
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        {serviceList.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-gray-400">{t("book.no_services")}</p>
          </div>
        ) : (
          serviceList.map((svc) => {
            const price = svc.price
              ? formatPrice(svc.price, currency)
              : svc.paymentMode === "FREE"
                ? t("common.free")
                : null;

            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onSelect(svc.id)}
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-3 text-start shadow-sm transition-all hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
              >
                {/* Service image or initial */}
                {svc.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt={svc.title}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                    style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                  >
                    {svc.title.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {svc.title}
                  </p>
                  {svc.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                      {svc.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {svc.durationMinutes} {t("common.min")}
                    </span>
                    {svc.isGroup && (
                      <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        <Users className="size-2.5" />
                        {t("svc.group_badge")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                {price && (
                  <span
                    className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: `${secondaryColor}12`, color: secondaryColor }}
                  >
                    {price}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
