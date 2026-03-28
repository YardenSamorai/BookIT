"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/onboarding/color-picker";
import { ChevronRight, ChevronUp, ChevronDown, Star, X } from "lucide-react";
import { reorderServices } from "@/actions/site-editor";
import { SERVICE_ICON_CATEGORIES, getServiceIcon } from "@/lib/service-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InferSelectModel } from "drizzle-orm";
import type { services as servicesSchema } from "@/lib/db/schema";

type Service = InferSelectModel<typeof servicesSchema>;

interface ServicesSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  services?: Service[];
}

export function ServicesSectionEditor({ content, onChange, services = [] }: ServicesSectionEditorProps) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [orderedServices, setOrderedServices] = useState<Service[]>(() =>
    [...services].sort((a, b) => a.sortOrder - b.sortOrder)
  );

  useEffect(() => {
    setOrderedServices([...services].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [services]);

  const primaryCount = (content.primary_count as number) ?? 0;
  const serviceIcons = (content.service_icons as Record<string, string>) ?? {};

  const setServiceIcon = useCallback((serviceId: string, iconName: string | null) => {
    const next = { ...serviceIcons };
    if (iconName) {
      next[serviceId] = iconName;
    } else {
      delete next[serviceId];
    }
    onChange({ service_icons: next });
  }, [serviceIcons, onChange]);

  const moveService = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedServices.length) return;
    setOrderedServices((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    startTransition(async () => {
      const updated = [...orderedServices];
      const [item] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, item);
      await reorderServices(updated.map((s) => s.id));
    });
  }, [orderedServices]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("svc_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "Our Services"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("svc_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("svc_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.card_layout")}</Label>
        <Select
          value={(content.card_layout as string) ?? "grid"}
          onValueChange={(v) => v && onChange({ card_layout: v })}
        >
          <SelectTrigger>
            <span>
              {{ grid: t("svc_editor.grid"), list: t("svc_editor.list"), compact: t("svc_editor.compact") }[(content.card_layout as string) ?? "grid"] ?? t("svc_editor.grid")}
            </span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="grid">{t("svc_editor.grid")}</SelectItem>
            <SelectItem value="list">{t("svc_editor.list")}</SelectItem>
            <SelectItem value="compact">{t("svc_editor.compact")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("svc_editor.show_prices")}</Label>
        <Switch
          checked={content.show_prices !== false}
          onCheckedChange={(checked) => onChange({ show_prices: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("svc_editor.show_duration")}</Label>
        <Switch
          checked={content.show_duration !== false}
          onCheckedChange={(checked) => onChange({ show_duration: checked })}
        />
      </div>

      {/* Primary count */}
      <div className="space-y-2">
        <Label>{t("svc_editor.primary_count" as any)}</Label>
        <p className="text-xs text-muted-foreground">{t("svc_editor.primary_count_desc" as any)}</p>
        <Select
          value={String(primaryCount)}
          onValueChange={(v) => onChange({ primary_count: Number(v) })}
        >
          <SelectTrigger>
            <span>{primaryCount === 0 ? t("svc_editor.show_all" as any) : primaryCount}</span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">{t("svc_editor.show_all" as any)}</SelectItem>
            {orderedServices.map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service order + icon selection */}
      {orderedServices.length > 0 && (
        <div className="space-y-2">
          <Label>{t("svc_editor.service_order" as any)}</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {orderedServices.map((svc, idx) => {
              const isPrimary = primaryCount > 0 && idx < primaryCount;
              const IconComp = getServiceIcon(serviceIcons[svc.id]);
              return (
                <div
                  key={svc.id}
                  className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                    isPrimary
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background"
                  } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <Popover>
                    <PopoverTrigger
                      className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      title="בחר אייקון"
                    >
                      {IconComp ? <IconComp className="size-3.5" /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-64 max-h-72 overflow-y-auto p-2" side="bottom" align="start">
                      <ServiceIconPicker
                        current={serviceIcons[svc.id]}
                        onSelect={(name) => setServiceIcon(svc.id, name)}
                      />
                    </PopoverContent>
                  </Popover>
                  {isPrimary && <Star className="size-3 shrink-0 fill-primary text-primary" />}
                  <span className="flex-1 truncate font-medium">{svc.title}</span>
                  <div className="flex shrink-0 flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      disabled={idx === 0 || isPending}
                      onClick={() => moveService(idx, idx - 1)}
                    >
                      <ChevronUp className="size-3" />
                    </button>
                    <button
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      disabled={idx === orderedServices.length - 1 || isPending}
                      onClick={() => moveService(idx, idx + 1)}
                    >
                      <ChevronDown className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {primaryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              <Star className="me-1 inline size-3 fill-primary text-primary" />
              {t("svc_editor.primary_hint" as any)}
            </p>
          )}
        </div>
      )}

      {/* Custom Colors */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
          {t("hero.custom_colors" as any)}
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorPicker
              label={t("svc_editor.title_color" as any)}
              value={(content.title_color as string) ?? ""}
              onChange={(v) => onChange({ title_color: v })}
            />
            <ColorPicker
              label={t("svc_editor.subtitle_color" as any)}
              value={(content.subtitle_color as string) ?? ""}
              onChange={(v) => onChange({ subtitle_color: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorPicker
              label={t("svc_editor.btn_bg_color" as any)}
              value={(content.btn_bg_color as string) ?? ""}
              onChange={(v) => onChange({ btn_bg_color: v })}
            />
            <ColorPicker
              label={t("svc_editor.btn_text_color" as any)}
              value={(content.btn_text_color as string) ?? ""}
              onChange={(v) => onChange({ btn_text_color: v })}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function ServiceIconPicker({
  current,
  onSelect,
}: {
  current?: string;
  onSelect: (name: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      {current && (
        <button
          onClick={() => onSelect(null)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
        >
          <X className="size-3" />
          הסר אייקון
        </button>
      )}
      {SERVICE_ICON_CATEGORIES.map((cat) => (
        <div key={cat.label_en}>
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">{cat.label_he}</p>
          <div className="grid grid-cols-6 gap-1">
            {cat.icons.map(({ name, label_he, Icon }) => (
              <button
                key={name}
                onClick={() => onSelect(name)}
                title={label_he}
                className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                  current === name
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
