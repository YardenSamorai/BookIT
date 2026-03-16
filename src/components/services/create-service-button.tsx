"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export function CreateServiceButton() {
  const t = useT();

  return (
    <Link href="/dashboard/services/new" className={buttonVariants()}>
      <Plus className="me-2 size-4" />
      {t("svc.add")}
    </Link>
  );
}
