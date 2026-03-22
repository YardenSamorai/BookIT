"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MoreVertical, Pencil, Archive, ArchiveRestore, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveCardTemplate, unarchiveCardTemplate, toggleCardTemplateActive } from "@/actions/cards";
import { useT } from "@/lib/i18n/locale-context";
import { formatPrice } from "@/lib/utils/currencies";
import type { CardTemplateRow } from "@/lib/db/queries/cards";

interface CardTemplateListProps {
  templates: CardTemplateRow[];
}

export function CardTemplateList({ templates }: CardTemplateListProps) {
  const t = useT();
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [pending, startTransition] = useTransition();

  const visible = showArchived
    ? templates
    : templates.filter((tpl) => !tpl.isArchived);

  function handleArchive(id: string) {
    startTransition(async () => {
      await archiveCardTemplate(id);
    });
  }

  function handleUnarchive(id: string) {
    startTransition(async () => {
      await unarchiveCardTemplate(id);
    });
  }

  function handleToggleActive(id: string, active: boolean) {
    startTransition(async () => {
      await toggleCardTemplateActive(id, active);
    });
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">{t("card.no_templates")}</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t("card.no_templates_desc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.some((tpl) => tpl.isArchived) && (
        <div className="flex items-center gap-2">
          <Switch
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <span className="text-sm text-muted-foreground">
            {t("card.show_archived")}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((tpl) => (
          <Card
            key={tpl.id}
            className={`relative transition-colors hover:bg-muted/30 ${
              tpl.isArchived ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{tpl.name}</h3>
                    {tpl.isArchived && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {t("card.archived_label")}
                      </Badge>
                    )}
                    {!tpl.isArchived && !tpl.isActive && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t("card.inactive_label")}
                      </Badge>
                    )}
                  </div>
                  {tpl.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {tpl.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/packages/${tpl.id}`)}
                    >
                      <Pencil className="mr-2 size-4" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    {!tpl.isArchived && (
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(tpl.id, !tpl.isActive)}
                      >
                        {tpl.isActive ? (
                          <EyeOff className="mr-2 size-4" />
                        ) : (
                          <Eye className="mr-2 size-4" />
                        )}
                        {tpl.isActive ? t("card.inactive_label") : t("card.is_active")}
                      </DropdownMenuItem>
                    )}
                    {tpl.isArchived ? (
                      <DropdownMenuItem onClick={() => handleUnarchive(tpl.id)}>
                        <ArchiveRestore className="mr-2 size-4" />
                        {t("card.unarchive")}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleArchive(tpl.id)}>
                        <Archive className="mr-2 size-4" />
                        {t("card.archive")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {tpl.sessionCount} {t("card.sessions")}
                </span>
                <span>·</span>
                <span className="font-medium text-foreground">
                  ₪{tpl.price}
                </span>
                {tpl.expirationDays ? (
                  <>
                    <span>·</span>
                    <span>
                      {t("card.expires_in", { n: String(tpl.expirationDays) })}
                    </span>
                  </>
                ) : (
                  <>
                    <span>·</span>
                    <span>{t("card.no_expiry")}</span>
                  </>
                )}
              </div>

              {tpl.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tpl.services.map((svc) => (
                    <Badge
                      key={svc.serviceId}
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {svc.serviceName}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
