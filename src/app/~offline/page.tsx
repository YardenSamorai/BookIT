"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-100">
        <svg className="size-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">אין חיבור לאינטרנט</h1>
      <p className="max-w-sm text-sm text-gray-500">
        נראה שאין חיבור לאינטרנט כרגע. בדקו את החיבור ונסו שוב.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95"
      >
        נסו שוב
      </button>
    </div>
  );
}
