"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export function CreateProductButton() {
  const t = useT();

  return (
    <Link href="/dashboard/products/new" className={buttonVariants()}>
      <Plus className="me-2 size-4" />
      {t("prod.add")}
    </Link>
  );
}
