"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirstPublishBannerProps {
  published: boolean;
  slug: string;
}

const STORAGE_KEY = "bookit_first_publish_celebrated";

export function FirstPublishBanner({ published, slug }: FirstPublishBannerProps) {
  const t = useT();
  const [show, setShow] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasCelebrated(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (published && !hasCelebrated) {
      setShow(true);
      localStorage.setItem(STORAGE_KEY, "1");
      setHasCelebrated(true);
    }
  }, [published, hasCelebrated]);

  const siteUrl = `/b/${slug}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/50"
        >
          <PartyPopper className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {t("publish.congrats_title")}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {t("publish.congrats_desc")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
            onClick={() => window.open(siteUrl, "_blank")}
          >
            {t("editor.view_site")}
            <ExternalLink className="ms-1.5 size-3" />
          </Button>
          <button
            onClick={() => setShow(false)}
            className="shrink-0 rounded-full p-1 text-emerald-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900"
          >
            <X className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
