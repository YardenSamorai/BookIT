"use client";

import { useState, useEffect, useTransition } from "react";
import { Info, AlertTriangle, Sparkles, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: typeof Info }> = {
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: Info },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle },
  update: { bg: "bg-violet-50", border: "border-violet-200", icon: Sparkles },
};

export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissed-announcements");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem("dismissed-announcements", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((ann) => {
        const style = TYPE_STYLES[ann.type] ?? TYPE_STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={ann.id}
            className={`relative flex items-start gap-3 rounded-lg border px-4 py-3 ${style.bg} ${style.border}`}
          >
            <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{ann.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{ann.body}</p>
            </div>
            <button
              onClick={() => dismiss(ann.id)}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
