"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Palette, Pencil, Link, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { EditorView } from "./editor-sidebar";

interface WelcomeOverlayProps {
  onStart: (view: EditorView) => void;
}

const STORAGE_KEY = "bookit_editor_welcomed";

const STEPS = [
  { labelKey: "welcome.step_style", Icon: Palette },
  { labelKey: "welcome.step_content", Icon: Pencil },
  { labelKey: "welcome.step_details", Icon: Link },
  { labelKey: "welcome.step_publish", Icon: Rocket },
] as const;

export function WelcomeOverlay({ onStart }: WelcomeOverlayProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  function dismiss(view: EditorView) {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    onStart(view);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mx-4 w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg"
          >
            <div className="mb-6 flex justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Rocket className="size-7 text-primary" />
              </div>
            </div>

            <h2 className="text-center text-xl font-bold">
              {t("welcome.title")}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t("welcome.subtitle")}
            </p>

            {/* Step path */}
            <div className="mt-6 flex items-center justify-between px-2">
              {STEPS.map((step, i) => (
                <div key={step.labelKey} className="flex flex-col items-center gap-1.5">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <step.Icon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t(step.labelKey as any)}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="absolute" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-2">
              <Button
                className="w-full"
                onClick={() => dismiss("design")}
              >
                {t("welcome.start")}
              </Button>
              <button
                onClick={() => dismiss("content")}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("welcome.skip")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
