"use client";

import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";
import { ChevronLeft } from "lucide-react";
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
          className="mb-4 flex items-center gap-1 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="size-4" />
          {t("book.change_service")}
        </button>
      )}

      {/* Selected service chip */}
      {serviceName && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
          {serviceImage ? (
            <img src={serviceImage} alt={serviceName} className="size-8 rounded-lg object-cover" />
          ) : (
            <div
              className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: secondaryColor }}
            >
              {serviceName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">{serviceName}</span>
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-900">
        {t("book.who_title")}
      </h2>
      <p className="mt-1 text-xs text-gray-400">
        {t("book.who_subtitle")}
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        {staff.map((member) => {
          const initials = member.name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-3 text-start shadow-sm transition-all hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
            >
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {member.name}
                </p>
                {member.roleTitle && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {member.roleTitle}
                  </p>
                )}
              </div>

              <ChevronLeft className="size-4 rotate-180 text-gray-300 transition-colors group-hover:text-gray-500 rtl:rotate-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
