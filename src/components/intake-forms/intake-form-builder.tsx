"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createIntakeForm,
  updateIntakeForm,
  type IntakeFormField,
} from "@/actions/intake-forms";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  Loader2,
  X,
} from "lucide-react";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "consent",
] as const;

const hasOptions = (type: string) =>
  type === "select" || type === "radio" || type === "checkbox";

interface Props {
  formId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialFields?: IntakeFormField[];
}

export function IntakeFormBuilder({
  formId,
  initialTitle = "",
  initialDescription = "",
  initialFields = [],
}: Props) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<IntakeFormField[]>(
    initialFields.length > 0 ? initialFields : []
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        id: nanoid(8),
        type: "text",
        label: "",
        required: false,
        placeholder: "",
        options: [],
      },
    ]);
  }

  function updateField(index: number, patch: Partial<IntakeFormField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    setFields((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  }

  function addOption(fieldIndex: number) {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex ? { ...f, options: [...(f.options ?? []), ""] } : f
      )
    );
  }

  function updateOption(
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: (f.options ?? []).map((o, j) =>
                j === optionIndex ? value : o
              ),
            }
          : f
      )
    );
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex
          ? { ...f, options: (f.options ?? []).filter((_, j) => j !== optionIndex) }
          : f
      )
    );
  }

  function handleSave() {
    setError("");
    setSuccess(false);

    if (!title.trim()) {
      setError(t("intake.form_title" as never));
      return;
    }
    if (fields.length === 0) {
      setError(t("intake.min_one_field" as never));
      return;
    }
    const emptyLabel = fields.some((f) => !f.label.trim());
    if (emptyLabel) {
      setError(t("intake.field_label" as never));
      return;
    }

    const cleaned = fields.map((f) => ({
      ...f,
      options: hasOptions(f.type)
        ? (f.options ?? []).filter((o) => o.trim() !== "")
        : undefined,
      placeholder: f.placeholder || undefined,
    }));

    startTransition(async () => {
      const result = formId
        ? await updateIntakeForm(formId, {
            title: title.trim(),
            description: description.trim() || undefined,
            fields: cleaned,
          })
        : await createIntakeForm({
            title: title.trim(),
            description: description.trim() || undefined,
            fields: cleaned,
          });

      if (result.success) {
        setSuccess(true);
        if (!formId && "data" in result && result.data) {
          router.push(
            `/dashboard/intake-forms/${(result.data as { id: string }).id}`
          );
        } else {
          router.refresh();
        }
      } else {
        setError("error" in result ? (result.error as string) : "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <Label>{t("intake.form_title" as never)}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("intake.form_title_ph" as never)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("intake.form_desc" as never)}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("intake.form_desc_ph" as never)}
            rows={2}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            {t("intake.fields" as never)}
          </Label>
          <span className="text-xs text-muted-foreground">
            {fields.length} {fields.length === 1 ? "field" : "fields"}
          </span>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("intake.no_forms_desc" as never)}
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border bg-background p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                  {idx + 1}
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => moveField(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title={t("intake.move_up" as never)}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveField(idx, 1)}
                  disabled={idx === fields.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title={t("intake.move_down" as never)}
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("intake.field_label" as never)}
                  </Label>
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      updateField(idx, { label: e.target.value })
                    }
                    placeholder={t("intake.field_label_ph" as never)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("intake.field_type" as never)}
                  </Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => {
                      if (!v) return;
                      updateField(idx, {
                        type: v as IntakeFormField["type"],
                        options: hasOptions(v) ? (field.options ?? [""]) : undefined,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((ft) => (
                        <SelectItem key={ft} value={ft}>
                          {t(`intake.type_${ft}` as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {field.type !== "consent" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("intake.field_placeholder" as never)}
                  </Label>
                  <Input
                    value={field.placeholder ?? ""}
                    onChange={(e) =>
                      updateField(idx, { placeholder: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Options for select/radio/checkbox */}
              {hasOptions(field.type) && (
                <div className="space-y-2">
                  <Label className="text-xs">
                    {t("intake.field_options" as never)}
                  </Label>
                  {(field.options ?? []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOption(idx, optIdx, e.target.value)
                        }
                        placeholder={t("intake.field_options_ph" as never)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx, optIdx)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(idx)}
                  >
                    <Plus className="mr-1 size-3" />
                    {t("intake.add_option" as never)}
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(v) => updateField(idx, { required: v })}
                />
                <Label className="text-xs">
                  {t("intake.field_required" as never)}
                </Label>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addField}
          className="w-full"
        >
          <Plus className="mr-1.5 size-4" />
          {t("intake.add_field" as never)}
        </Button>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {t("intake.saved" as never)}
        </div>
      )}

      {/* Save */}
      <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 size-4" />
        )}
        {t("common.save")}
      </Button>
    </div>
  );
}
