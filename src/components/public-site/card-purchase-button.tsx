"use client";

import { useState } from "react";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  cardTemplateId: string;
  businessId: string;
  color: string;
}

export function CardPurchaseButton({ cardTemplateId, businessId, color }: Props) {
  const t = useT();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePurchase() {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardTemplateId, businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "NOT_AUTHENTICATED") {
          setErrorMsg(t("book.login_to_book"));
          setState("error");
          return;
        }
        setErrorMsg(data.error || t("card.purchase_error"));
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg(t("card.purchase_error"));
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 sm:mt-3">
        <CheckCircle2 className="size-3.5" />
        {t("card.purchase_pending")}
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
          <Wallet className="size-3.5" />
        )}
        {t("card.buy_card")}
      </button>
      {state === "error" && errorMsg && (
        <p className="mt-1 text-[10px] text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
