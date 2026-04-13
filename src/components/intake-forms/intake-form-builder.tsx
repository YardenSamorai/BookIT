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
  Eye,
  CheckCircle2,
  ClipboardCheck,
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
  const [showPreview, setShowPreview] = useState(false);

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

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-4" />
          )}
          {t("common.save")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={fields.length === 0}
          className="w-full sm:w-auto"
        >
          <Eye className="mr-1.5 size-4" />
          {t("intake.preview" as never)}
        </Button>
      </div>

      {showPreview && (
        <IntakeFormPreview
          title={title || t("intake.form_title" as never)}
          description={description}
          fields={fields}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function IntakeFormPreview({
  title,
  description,
  fields,
  onClose,
}: {
  title: string;
  description: string;
  fields: IntakeFormField[];
  onClose: () => void;
}) {
  const t = useT();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const secondaryColor = "#3B82F6";

  function setValue(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: false }));
  }

  function toggleCheckbox(fieldId: string, option: string) {
    setResponses((prev) => {
      const current = (prev[fieldId] as string[]) ?? [];
      return {
        ...prev,
        [fieldId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
    setErrors((prev) => ({ ...prev, [fieldId]: false }));
  }

  function validate(): boolean {
    const newErrors: Record<string, boolean> = {};
    let valid = true;
    for (const field of fields) {
      if (!field.required) continue;
      const val = responses[field.id];
      if (field.type === "consent") {
        if (val !== true) { newErrors[field.id] = true; valid = false; }
      } else if (field.type === "checkbox") {
        if (!Array.isArray(val) || val.length === 0) { newErrors[field.id] = true; valid = false; }
      } else {
        if (val == null || String(val).trim() === "") { newErrors[field.id] = true; valid = false; }
      }
    }
    setErrors(newErrors);
    return valid;
  }

  function handleTestSubmit() {
    if (validate()) setSubmitted(true);
  }

  function handleReset() {
    setResponses({});
    setErrors({});
    setSubmitted(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Eye className="size-4" />
            {t("intake.preview" as never)}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("intake.test_success" as never)}
              </h3>
              <p className="text-sm text-slate-500">
                {t("intake.test_success_desc" as never)}
              </p>
              <div className="mt-2 w-full rounded-xl border bg-slate-50 p-4 text-start">
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">
                  {t("intake.test_data" as never)}
                </p>
                <div className="space-y-1.5">
                  {fields.map((f) => {
                    const val = responses[f.id];
                    const display = Array.isArray(val) ? val.join(", ") : val === true ? "✓" : String(val ?? "—");
                    return (
                      <div key={f.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">{f.label}</span>
                        <span className="font-medium text-slate-900">{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleReset}>
                  {t("intake.test_again" as never)}
                </Button>
                <Button onClick={onClose}>
                  {t("common.close" as never)}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardCheck className="size-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              </div>
              {description && (
                <p className="text-sm text-slate-400 mb-4">{description}</p>
              )}
              <div className="space-y-4">
                {fields.map((field) => (
                  <PreviewFieldRenderer
                    key={field.id}
                    field={field}
                    value={responses[field.id]}
                    error={errors[field.id]}
                    secondaryColor={secondaryColor}
                    onChange={(v) => setValue(field.id, v)}
                    onToggleCheckbox={(opt) => toggleCheckbox(field.id, opt)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="border-t px-5 py-3.5">
            <button
              type="button"
              onClick={handleTestSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
              style={{ backgroundColor: secondaryColor }}
            >
              <CheckCircle2 className="size-5" />
              {t("intake.test_submit" as never)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewFieldRenderer({
  field,
  value,
  error,
  secondaryColor,
  onChange,
  onToggleCheckbox,
}: {
  field: IntakeFormField;
  value: unknown;
  error?: boolean;
  secondaryColor: string;
  onChange: (value: unknown) => void;
  onToggleCheckbox: (option: string) => void;
}) {
  const borderClass = error
    ? "border-red-300 ring-1 ring-red-300"
    : "border-gray-100 focus-within:border-gray-200 focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

  switch (field.type) {
    case "text":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <input type="text" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`} />
        </div>
      );
    case "textarea":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`} />
        </div>
      );
    case "number":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`} />
        </div>
      );
    case "date":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:outline-none ${borderClass}`} />
        </div>
      );
    case "select":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:outline-none ${borderClass}`}>
            <option value="">{field.placeholder || "—"}</option>
            {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    case "radio":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <div className="mt-1.5 space-y-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm">
                <input type="radio" name={`preview-${field.id}`} checked={(value as string) === opt} onChange={() => onChange(opt)} style={{ accentColor: secondaryColor }} />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="mt-1 text-xs text-red-500">*</p>}
        </div>
      );
    case "checkbox":
      return (
        <div>
          <PreviewLabel label={field.label} required={field.required} />
          <div className="mt-1.5 space-y-2">
            {(field.options ?? []).map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm">
                  <input type="checkbox" checked={checked} onChange={() => onToggleCheckbox(opt)} style={{ accentColor: secondaryColor }} />
                  {opt}
                </label>
              );
            })}
          </div>
          {error && <p className="mt-1 text-xs text-red-500">*</p>}
        </div>
      );
    case "consent":
      return (
        <div className={`rounded-xl border p-4 ${error ? "border-red-300 bg-red-50/50" : "border-gray-100 bg-gray-50/50"}`}>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4" style={{ accentColor: secondaryColor }} />
            <span className="flex-1 leading-relaxed text-gray-700">{field.label}</span>
          </label>
          {field.required && <p className="mt-1 ps-7 text-[11px] text-gray-400">*</p>}
        </div>
      );
    default:
      return null;
  }
}

function PreviewLabel({ label, required }: { label: string; required: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="ms-0.5 text-red-400">*</span>}
    </label>
  );
}
