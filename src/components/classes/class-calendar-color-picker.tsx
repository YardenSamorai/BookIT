"use client";

import { cn } from "@/lib/utils";
import {
  CLASS_CALENDAR_COLOR_PRESETS,
} from "@/components/calendar/calendar-types";

interface Props {
  value: string | null;
  onChange: (hex: string | null) => void;
  disabled?: boolean;
  hint?: string;
  defaultLabel: string;
}

export function ClassCalendarColorPicker({
  value,
  onChange,
  disabled,
  hint,
  defaultLabel,
}: Props) {
  return (
    <div className="space-y-2">
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {CLASS_CALENDAR_COLOR_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            disabled={disabled}
            title={hex}
            onClick={() => onChange(hex)}
            className={cn(
              "size-8 rounded-full border-2 shadow-sm transition-transform hover:scale-105 disabled:opacity-50",
              value === hex
                ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                : "border-white/90"
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 border-dashed text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50",
            value === null
              ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
              : "border-muted-foreground/40"
          )}
          title={defaultLabel}
        >
          <span className="text-xs font-semibold leading-none">·</span>
        </button>
      </div>
    </div>
  );
}
