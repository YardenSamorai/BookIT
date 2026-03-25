"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { AutoSaveStatus } from "@/hooks/use-auto-save";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  onRetry?: () => void;
}

export function AutoSaveIndicator({ status, onRetry }: AutoSaveIndicatorProps) {
  const t = useT();

  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1.5 text-xs"
      >
        {status === "saving" && (
          <>
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">{t("editor.auto_saving")}</span>
          </>
        )}
        {status === "saved" && (
          <>
            <Check className="size-3 text-emerald-500" />
            <span className="text-emerald-600">{t("editor.auto_saved")}</span>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="size-3 text-red-500" />
            <span className="text-red-600">{t("editor.save_failed")}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="ms-1 underline text-red-600 hover:text-red-700"
              >
                {t("editor.retry")}
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
