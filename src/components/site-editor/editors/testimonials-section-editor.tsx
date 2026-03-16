"use client";

import { useMemo, useCallback } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Testimonial {
  name: string;
  text: string;
  role: string;
  rating: number;
}

interface TestimonialsSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

const MAX_TESTIMONIALS = 6;

function parseTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return {
      name: String(o?.name ?? ""),
      text: String(o?.text ?? ""),
      role: String(o?.role ?? ""),
      rating: Math.min(5, Math.max(1, Number(o?.rating ?? 5))),
    };
  });
}

export function TestimonialsSectionEditor({
  content,
  onChange,
}: TestimonialsSectionEditorProps) {
  const t = useT();
  const rawTestimonials = content.testimonials;
  const testimonials = useMemo(() => parseTestimonials(rawTestimonials), [
    rawTestimonials,
  ]);

  const updateTestimonials = useCallback(
    (next: Testimonial[]) => {
      onChange({ testimonials: next });
    },
    [onChange]
  );

  const updateTestimonial = (index: number, patch: Partial<Testimonial>) => {
    const next = [...testimonials];
    next[index] = { ...next[index], ...patch };
    updateTestimonials(next);
  };

  const removeTestimonial = (index: number) => {
    updateTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const addTestimonial = () => {
    if (testimonials.length >= MAX_TESTIMONIALS) return;
    updateTestimonials([
      ...testimonials,
      { name: "", text: "", role: "", rating: 5 },
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("testimonial_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "What Our Clients Say"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("testimonial_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("testimonial_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("testimonial_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("testimonial_editor.layout")}</Label>
        <Select
          value={(content.layout as string) ?? "cards"}
          onValueChange={(v) => v && onChange({ layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">{t("testimonial_editor.cards")}</SelectItem>
            <SelectItem value="slider">{t("testimonial_editor.slider")}</SelectItem>
            <SelectItem value="minimal">{t("testimonial_editor.minimal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("testimonial_editor.testimonials")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTestimonial}
            disabled={testimonials.length >= MAX_TESTIMONIALS}
          >
            <Plus className="me-1 size-4" />
            {t("testimonial_editor.add")}
          </Button>
        </div>

        <div className="space-y-4">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("testimonial_editor.name_label")}</Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateTestimonial(index, { name: e.target.value })
                      }
                      placeholder={t("testimonial_editor.name_ph")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("testimonial_editor.role_label")}</Label>
                    <Input
                      value={item.role}
                      onChange={(e) =>
                        updateTestimonial(index, { role: e.target.value })
                      }
                      placeholder={t("testimonial_editor.role_ph")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("testimonial_editor.quote_label")}</Label>
                    <textarea
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={item.text}
                      onChange={(e) =>
                        updateTestimonial(index, { text: e.target.value })
                      }
                      placeholder={t("testimonial_editor.text_ph")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("testimonial_editor.rating_label")}</Label>
                    <Select
                      value={String(item.rating)}
                      onValueChange={(v) =>
                        updateTestimonial(index, { rating: Number(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n === 1 ? t("testimonial_editor.star", { n }) : t("testimonial_editor.stars", { n })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTestimonial(index)}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("testimonial_editor.no_items")}
          </p>
        )}
      </div>
    </div>
  );
}
