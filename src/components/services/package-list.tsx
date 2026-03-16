"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createServicePackage, deleteServicePackage } from "@/actions/services";
import type { InferSelectModel } from "drizzle-orm";
import type { services, servicePackages } from "@/lib/db/schema";
import { Loader2, Package, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type Service = InferSelectModel<typeof services>;
type PackageType = InferSelectModel<typeof servicePackages>;

interface PackageListProps {
  packages: PackageType[];
  services: Service[];
}

export function PackageList({ packages, services: serviceList }: PackageListProps) {
  const router = useRouter();
  const t = useT();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [sessionCount, setSessionCount] = useState(10);
  const [price, setPrice] = useState("");
  const [expirationDays, setExpirationDays] = useState(0);

  function reset() {
    setServiceId("");
    setName("");
    setSessionCount(10);
    setPrice("");
    setExpirationDays(0);
    setError("");
  }

  async function handleAdd() {
    setAdding(true);
    setError("");

    const result = await createServicePackage({
      serviceId,
      name,
      sessionCount,
      price,
      expirationDays: expirationDays || undefined,
      isActive: true,
    });

    if (!result.success) {
      setError(result.error);
      setAdding(false);
      return;
    }

    setAdding(false);
    setDialogOpen(false);
    reset();
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteServicePackage(id);
    setDeletingId(null);
    router.refresh();
  }

  const getServiceName = (id: string) =>
    serviceList.find((s) => s.id === id)?.title ?? "Unknown";

  return (
    <div className="space-y-4">
      <Button onClick={() => setDialogOpen(true)} size="sm">
        <Plus className="me-2 size-4" />
        {t("pkg.new")}
      </Button>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("pkg.no_packages")}</p>
              <p className="text-sm text-muted-foreground">
                {t("pkg.no_packages_desc")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{pkg.name}</p>
                  {!pkg.isActive && (
                    <Badge variant="secondary" className="text-xs">{t("common.inactive")}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pkg.sessionCount} {t("pkg.sessions")} · ₪{pkg.price} ·{" "}
                  {getServiceName(pkg.serviceId)}
                  {pkg.expirationDays
                    ? ` · ${t("pkg.expires", { n: pkg.expirationDays })}`
                    : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(pkg.id)}
                disabled={deletingId === pkg.id}
              >
                {deletingId === pkg.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-destructive" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pkg.dialog_title")}</DialogTitle>
            <DialogDescription>
              {t("pkg.dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("pkg.service")}</Label>
              <Select value={serviceId} onValueChange={(v) => setServiceId(v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("pkg.select_service")} />
                </SelectTrigger>
                <SelectContent>
                  {serviceList.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("pkg.name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("pkg.name_ph")}
                disabled={adding}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pkg.session_count")}</Label>
                <Input
                  type="number"
                  min={2}
                  max={100}
                  value={sessionCount}
                  onChange={(e) => setSessionCount(Number(e.target.value))}
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pkg.total_price")}</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={adding}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("pkg.expiration")}</Label>
              <Input
                type="number"
                min={0}
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                disabled={adding}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleAdd}
              disabled={adding || !serviceId || !name || !price}
              className="w-full"
            >
              {adding && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("pkg.create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
