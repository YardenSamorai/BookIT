"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { deleteStaffMember } from "@/actions/staff";
import { MoreVertical, Pencil, Calendar, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/locale-context";

interface StaffActionsProps {
  staffId: string;
  staffName: string;
}

export function StaffActions({ staffId, staffName }: StaffActionsProps) {
  const router = useRouter();
  const t = useT();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteStaffMember(staffId);
    setDeleteOpen(false);
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={`/dashboard/staff/${staffId}`} />}
          >
            <Pencil className="me-2 size-4" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/dashboard/staff/${staffId}/schedule`} />}
          >
            <Calendar className="me-2 size-4" />
            {t("staff.schedule")}
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("staff.delete_title")}</DialogTitle>
            <DialogDescription>
              {t("staff.delete_confirm", { name: staffName })}
            </DialogDescription>
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
