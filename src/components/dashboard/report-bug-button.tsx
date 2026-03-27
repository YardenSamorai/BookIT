"use client";

import { useState, useTransition } from "react";
import { Bug, Send, X, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTicket } from "@/actions/tickets";
import { useT } from "@/lib/i18n/locale-context";

export function ReportBugButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!subject.trim() || !description.trim()) return;
    startTransition(async () => {
      const result = await createTicket(subject, description);
      if (result.success) {
        setSent(true);
        setTimeout(() => {
          setOpen(false);
          setSent(false);
          setSubject("");
          setDescription("");
        }, 1800);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 start-6 z-50 flex size-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-700"
        title={t("tickets.report_bug" as never)}
      >
        <Bug className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="size-5 text-slate-600" />
              {t("tickets.report_bug" as never)}
            </DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="size-10 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700">
                {t("tickets.success" as never)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("tickets.subject" as never)}
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("tickets.subject_placeholder" as never)}
                  disabled={pending}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("tickets.description" as never)}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("tickets.description_placeholder" as never)}
                  rows={5}
                  disabled={pending}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  <X className="mr-1 size-4" />
                  {t("tickets.cancel" as never)}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={pending || !subject.trim() || !description.trim()}
                >
                  {pending ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-1 size-4" />
                  )}
                  {t("tickets.submit" as never)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
