"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { deleteProduct } from "@/actions/products";
import { formatPrice } from "@/lib/utils/currencies";
import { useT } from "@/lib/i18n/locale-context";
import {
  Package,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Star,
  EyeOff,
} from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";

type Product = InferSelectModel<typeof products>;

interface ProductListProps {
  products: Product[];
  businessId: string;
  currency: string;
}

export function ProductList({ products: items, businessId, currency }: ProductListProps) {
  const t = useT();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Package className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("prod.no_products")}</p>
            <p className="text-sm text-muted-foreground">
              {t("prod.no_products_desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          businessId={businessId}
          currency={currency}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  businessId,
  currency,
}: {
  product: Product;
  businessId: string;
  currency: string;
}) {
  const t = useT();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteProduct(product.id, businessId);
    setDeleteOpen(false);
    setDeleting(false);
    router.refresh();
  }

  const firstImage = product.images?.[0];

  return (
    <>
      <Card className="group relative overflow-hidden">
        {firstImage && (
          <div className="aspect-video w-full overflow-hidden bg-gray-50">
            <img
              src={firstImage}
              alt={product.title}
              className="size-full object-contain p-2 transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className={firstImage ? "pt-3" : "pt-4"}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-medium leading-tight">{product.title}</p>
                {product.isFeatured && (
                  <Badge variant="default" className="text-xs">
                    <Star className="me-0.5 size-3" />
                    {t("prod.featured")}
                  </Badge>
                )}
                {!product.isVisible && (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="me-0.5 size-3" />
                    {t("common.hidden")}
                  </Badge>
                )}
              </div>
              {product.category && (
                <p className="text-xs text-muted-foreground">{product.category}</p>
              )}
              {product.price && (
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(product.price, currency)}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${product.id}`)}>
                  <Pencil className="me-2 size-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="me-2 size-4" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("prod.delete_title")}</DialogTitle>
            <DialogDescription>{t("prod.delete_confirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
