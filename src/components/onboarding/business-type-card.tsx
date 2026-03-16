"use client";

import { cn } from "@/lib/utils";
import { Scissors, Sparkles, Dumbbell, GraduationCap, Stethoscope, Briefcase } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  BARBER: Scissors,
  BEAUTY: Sparkles,
  FITNESS: Dumbbell,
  TUTOR: GraduationCap,
  CLINIC: Stethoscope,
  GENERIC: Briefcase,
};

interface BusinessTypeCardProps {
  value: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function BusinessTypeCard({
  value,
  label,
  selected,
  onSelect,
  disabled,
}: BusinessTypeCardProps) {
  const Icon = TYPE_ICONS[value] ?? Briefcase;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-muted bg-background",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <Icon className={cn("size-6", selected ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-foreground")}>
        {label}
      </span>
    </button>
  );
}
