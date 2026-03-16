"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffActions } from "./staff-actions";
import type { InferSelectModel } from "drizzle-orm";
import type { staffMembers } from "@/lib/db/schema";
import { UserCog } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type StaffMember = InferSelectModel<typeof staffMembers>;

interface StaffListProps {
  members: StaffMember[];
}

export function StaffList({ members }: StaffListProps) {
  const t = useT();

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <UserCog className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("staff.no_staff")}</p>
            <p className="text-sm text-muted-foreground">
              {t("staff.no_staff_desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <StaffCard key={member.id} member={member} />
      ))}
    </div>
  );
}

function StaffCard({ member }: { member: StaffMember }) {
  const t = useT();

  return (
    <Card className="relative">
      <CardContent className="flex items-start gap-4 pt-4">
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-lg font-semibold">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{member.name}</p>
            {!member.isActive && (
              <Badge variant="secondary" className="text-xs">
                {t("common.inactive")}
              </Badge>
            )}
          </div>
          {member.roleTitle && (
            <p className="text-sm text-muted-foreground">{member.roleTitle}</p>
          )}
        </div>
        <StaffActions staffId={member.id} staffName={member.name} />
      </CardContent>
    </Card>
  );
}
