"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createServiceCategory, deleteServiceCategory } from "@/actions/services";
import type { InferSelectModel } from "drizzle-orm";
import type { serviceCategories } from "@/lib/db/schema";
import { Folder, Loader2, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type Category = InferSelectModel<typeof serviceCategories>;

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    setAdding(true);
    setError("");

    const result = await createServiceCategory({ name: name.trim() });

    if (!result.success) {
      setError(result.error);
    } else {
      setName("");
    }

    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteServiceCategory(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("cat.new_ph")}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={adding}
          className="max-w-xs"
        />
        <Button onClick={handleAdd} disabled={adding || !name.trim()} size="sm">
          {adding ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Plus className="me-2 size-4" />
          )}
          {t("common.add")}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Folder className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("cat.no_categories")}</p>
              <p className="text-sm text-muted-foreground">
                {t("cat.no_categories_desc")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm font-medium">{cat.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
              >
                {deletingId === cat.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-destructive" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
