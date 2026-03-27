"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100">
          <TriangleAlert className="size-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">משהו השתבש</h2>
        <p className="mt-2 text-sm text-slate-500">
          אירעה שגיאה בטעינת העמוד. אנא נסו שוב.
        </p>
        <Button onClick={reset} className="mt-6 gap-2">
          <RotateCcw className="size-4" />
          נסו שוב
        </Button>
      </div>
    </div>
  );
}
