"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffForm } from "./staff-form";
import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";
import { useT } from "@/lib/i18n/locale-context";

type StaffMember = InferSelectModel<typeof staffMembers>;

interface StaffEditFormProps {
  member: StaffMember;
}

export function StaffEditForm({ member }: StaffEditFormProps) {
  const router = useRouter();
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("staff.details")}</CardTitle>
      </CardHeader>
      <CardContent>
        <StaffForm
          defaultValues={{
            id: member.id,
            name: member.name,
            phone: member.phone ?? "",
            notifyOwner: member.notifyOwner,
            roleTitle: member.roleTitle ?? "",
            bio: member.bio ?? "",
            imageUrl: member.imageUrl ?? "",
            isActive: member.isActive,
          }}
          onSuccess={() => router.push("/dashboard/staff")}
        />
      </CardContent>
    </Card>
  );
}
