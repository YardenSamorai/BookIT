"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateServiceStaff } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { Check, Loader2, Users } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";

type StaffMember = InferSelectModel<typeof staffMembers>;

interface Props {
  serviceId: string;
  serviceName: string;
  staff: StaffMember[];
  linkedStaffIds: string[];
}

export function ServiceStaffEditor({ serviceId, serviceName, staff, linkedStaffIds }: Props) {
  const t = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(linkedStaffIds));
  const [isPending, startTransition] = useTransition();

  function toggle(staffId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateServiceStaff(serviceId, [...selected]);
      router.refresh();
    });
  }

  const hasChanges = (() => {
    const original = new Set(linkedStaffIds);
    if (original.size !== selected.size) return true;
    for (const id of selected) if (!original.has(id)) return true;
    return false;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Users className="size-4" />
        {t("svc.linked_staff")}
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("svc.no_staff_available")}</p>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => {
            const isLinked = selected.has(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggle(member.id)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-start transition-all ${
                  isLinked
                    ? "border-primary bg-primary/5"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="size-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.roleTitle && <p className="text-xs text-muted-foreground">{member.roleTitle}</p>}
                </div>
                {isLinked && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {hasChanges && (
        <Button onClick={handleSave} disabled={isPending} size="sm" className="w-full">
          {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
          {t("svc.save_staff_links")}
        </Button>
      )}
    </div>
  );
}
