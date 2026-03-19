"use client";

import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/locale-context";

type StaffMember = InferSelectModel<typeof staffMembers>;

interface StepStaffProps {
  staff: StaffMember[];
  selectedId: string;
  secondaryColor: string;
  serviceName?: string;
  serviceImage?: string | null;
  onSelect: (id: string) => void;
  onBack?: () => void;
}

export function StepStaff({
  staff,
  selectedId,
  secondaryColor,
  serviceName,
  serviceImage,
  onSelect,
  onBack,
}: StepStaffProps) {
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
          {t("book.change_service")}
        </button>
      )}

      {serviceName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 inline-flex items-center gap-2.5 self-start rounded-full border border-gray-100 bg-gray-50/80 py-1.5 pe-4 ps-1.5"
        >
          {serviceImage ? (
            <img
              src={serviceImage}
              alt={serviceName}
              className="size-7 rounded-full object-cover ring-1 ring-black/5"
            />
          ) : (
            <div
              className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: secondaryColor }}
            >
              {serviceName.charAt(0)}
            </div>
          )}
          <span className="text-[13px] font-medium text-gray-600">{serviceName}</span>
        </motion.div>
      )}

      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {t("book.who_title")}
      </h2>
      <p className="mt-1 text-sm text-gray-400">
        {t("book.who_subtitle")}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {staff.map((member, i) => {
          const initials = member.name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-start shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.98]"
            >
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}cc)`,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-gray-900">
                  {member.name}
                </p>
                {member.roleTitle && (
                  <p className="mt-0.5 text-[13px] text-gray-400">
                    {member.roleTitle}
                  </p>
                )}
              </div>

              <ChevronLeft className="size-5 text-gray-300 transition-colors group-hover:text-gray-500 rtl:rotate-0 ltr:rotate-180" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
