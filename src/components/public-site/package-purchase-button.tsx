"use client";

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  productId: string;
  businessId: string;
  color: string;
}

export function PackagePurchaseButton({ productId, businessId, color }: Props) {
  const t = useT();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePurchase() {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/purchase-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "NOT_AUTHENTICATED") {
          setErrorMsg(t("book.login_to_book"));
          setState("error");
          return;
        }
        setErrorMsg(data.error || "Error");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Network error");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 sm:mt-3">
        <CheckCircle2 className="size-3.5" />
        {t("pkg.status_active" as Parameters<typeof t>[0])}
      </div>
    );
  }

  return (
    <div className="mt-2 sm:mt-3">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={state === "loading"}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
        style={{ backgroundColor: color }}
      >
        {state === "loading" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CreditCard className="size-3.5" />
        )}
        {t("prod.buy_card" as Parameters<typeof t>[0])}
      </button>
      {state === "error" && errorMsg && (
        <p className="mt-1 text-[10px] text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
