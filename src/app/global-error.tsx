"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="he" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">שגיאה בלתי צפויה</h1>
          <p className="mt-2 text-sm text-slate-500">
            משהו השתבש. הצוות שלנו קיבל התראה ואנחנו עובדים על פתרון.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            נסו שוב
          </button>
        </div>
      </body>
    </html>
  );
}
