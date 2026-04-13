"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { IntakeFormField } from "@/actions/intake-forms";

interface Props {
  formTitle: string;
  formDescription?: string;
  fields: IntakeFormField[];
  secondaryColor: string;
  onSubmit: (responses: Record<string, unknown>) => void;
  onBack: () => void;
  loading?: boolean;
}

export function StepIntakeForm({
  formTitle,
  formDescription,
  fields,
  secondaryColor,
  onSubmit,
  onBack,
  loading = false,
}: Props) {
  const t = useT();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function setValue(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: false }));
  }

  function toggleCheckboxOption(fieldId: string, option: string) {
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
        if (val !== true) {
          newErrors[field.id] = true;
          valid = false;
        }
      } else if (field.type === "checkbox") {
        if (!Array.isArray(val) || val.length === 0) {
          newErrors[field.id] = true;
          valid = false;
        }
      } else {
        if (val == null || String(val).trim() === "") {
          newErrors[field.id] = true;
          valid = false;
        }
      }
    }

    setErrors(newErrors);
    return valid;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit(responses);
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 self-start text-sm text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("common.back")}
      </button>

      <div className="flex items-center gap-2">
        <ClipboardCheck className="size-5" style={{ color: secondaryColor }} />
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          {formTitle}
        </h2>
      </div>
      {formDescription && (
        <p className="mt-1 text-sm text-gray-400">{formDescription}</p>
      )}
      <p className="mt-0.5 text-xs text-gray-400">
        {t("intake.fill_form_desc" as never)}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-5 space-y-4"
      >
        {fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={responses[field.id]}
            error={errors[field.id]}
            secondaryColor={secondaryColor}
            onChange={(v) => setValue(field.id, v)}
            onToggleCheckbox={(opt) => toggleCheckboxOption(field.id, opt)}
          />
        ))}
      </motion.div>

      <div className="flex-1" />

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        style={{
          backgroundColor: secondaryColor,
          boxShadow: `0 4px 14px ${secondaryColor}30`,
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <CheckCircle2 className="size-5" />
        )}
        {t("book.confirm_booking")}
      </motion.button>
    </div>
  );
}

function FieldRenderer({
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
          <FieldLabel label={field.label} required={field.required} />
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`}
          />
        </div>
      );

    case "number":
      return (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-300 focus:outline-none ${borderClass}`}
          />
        </div>
      );

    case "date":
      return (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:outline-none ${borderClass}`}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:outline-none ${borderClass}`}
          >
            <option value="">
              {field.placeholder || "—"}
            </option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "radio":
      return (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <div className="mt-1.5 space-y-2">
            {(field.options ?? []).map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm"
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={(value as string) === opt}
                  onChange={() => onChange(opt)}
                  style={{ accentColor: secondaryColor }}
                />
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
          <FieldLabel label={field.label} required={field.required} />
          <div className="mt-1.5 space-y-2">
            {(field.options ?? []).map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCheckbox(opt)}
                    style={{ accentColor: secondaryColor }}
                  />
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
        <div
          className={`rounded-xl border p-4 ${error ? "border-red-300 bg-red-50/50" : "border-gray-100 bg-gray-50/50"}`}
        >
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-0.5 size-4"
              style={{ accentColor: secondaryColor }}
            />
            <span className="flex-1 leading-relaxed text-gray-700">
              {field.label}
            </span>
          </label>
          {field.required && (
            <p className="mt-1 ps-7 text-[11px] text-gray-400">*</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="ms-0.5 text-red-400">*</span>}
    </label>
  );
}
