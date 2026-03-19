"use client";

import type { InferSelectModel } from "drizzle-orm";
import type { services } from "@/lib/db/schema";
import { Clock, Users, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
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
          className="mb-4 flex items-center gap-1.5 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("book.change_professional")}
        </button>
      )}

      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {t("book.choose_service")}
      </h2>
      <p className="mt-1 text-sm text-gray-400">
        {t("book.select_service")}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {serviceList.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-gray-400">{t("book.no_services")}</p>
          </div>
        ) : (
          serviceList.map((svc, i) => {
            const price = svc.price
              ? formatPrice(svc.price, currency)
              : svc.paymentMode === "FREE"
                ? t("common.free")
                : null;

            return (
              <motion.button
                key={svc.id}
                type="button"
                onClick={() => onSelect(svc.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="group relative flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-start shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.98]"
              >
                {svc.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt={svc.title}
                    className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
                  />
                ) : (
                  <div
                    className="flex size-16 shrink-0 items-center justify-center rounded-xl text-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor}15, ${secondaryColor}30)`,
                      color: secondaryColor,
                    }}
                  >
                    {svc.title.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-gray-900">
                    {svc.title}
                  </p>
                  {svc.description && (
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-gray-400">
                      {svc.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                      <Clock className="size-3" />
                      {svc.durationMinutes} {t("common.min")}
                    </span>
                    {svc.isGroup && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                        <Users className="size-3" />
                        {t("svc.group_badge")}
                      </span>
                    )}
                  </div>
                </div>

                {price && (
                  <span
                    className="shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor}08, ${secondaryColor}15)`,
                      color: secondaryColor,
                    }}
                  >
                    {price}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
