"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ActionResult } from "@/types";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  delay?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export function useAutoSave(
  saveFn: () => Promise<ActionResult>,
  deps: unknown[],
  options: UseAutoSaveOptions = {}
) {
  const { delay = 2000, maxRetries = 3, retryDelay = 3000 } = options;
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const isFirstRender = useRef(true);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const doSave = useCallback(async () => {
    setStatus("saving");
    try {
      const result = await saveFnRef.current();
      if (result.success) {
        retriesRef.current = 0;
        setStatus("saved");
        savedTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
      } else {
        throw new Error(result.error);
      }
    } catch {
      if (retriesRef.current < maxRetries) {
        retriesRef.current++;
        timerRef.current = setTimeout(doSave, retryDelay);
      } else {
        setStatus("error");
      }
    }
  }, [maxRetries, retryDelay]);

  const retry = useCallback(() => {
    retriesRef.current = 0;
    doSave();
  }, [doSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    timerRef.current = setTimeout(doSave, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { status, retry };
}

export function combineSaveStatuses(
  ...statuses: AutoSaveStatus[]
): AutoSaveStatus {
  if (statuses.some((s) => s === "error")) return "error";
  if (statuses.some((s) => s === "saving")) return "saving";
  if (statuses.some((s) => s === "saved")) return "saved";
  return "idle";
}
