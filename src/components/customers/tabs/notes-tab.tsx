"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Send, StickyNote, Loader2 } from "lucide-react";
import { addCustomerNote, updateCustomerTags, updateGeneralNotes } from "@/actions/customers";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerProfile } from "@/lib/db/queries/customers";

interface Props {
  customer: CustomerProfile;
  businessId: string;
  onRefresh: () => void;
}

export function NotesTab({ customer, businessId, onRefresh }: Props) {
  const t = useT();
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <GeneralNotesSection
        customerId={customer.id}
        initialNotes={customer.generalNotes ?? ""}
        t={t}
        onRefresh={onRefresh}
      />
      <TagsSection
        customerId={customer.id}
        tags={customer.tags}
        t={t}
        onRefresh={onRefresh}
      />
      <NotesFeedSection
        customerId={customer.id}
        businessId={businessId}
        notes={customer.notes}
        locale={locale}
        t={t}
        onRefresh={onRefresh}
      />
    </div>
  );
}

function GeneralNotesSection({
  customerId,
  initialNotes,
  t,
  onRefresh,
}: {
  customerId: string;
  initialNotes: string;
  t: ReturnType<typeof useT>;
  onRefresh: () => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const isDirty = notes !== initialNotes;

  function handleSave() {
    startTransition(async () => {
      await updateGeneralNotes(customerId, notes);
      onRefresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("cust.general_notes")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("cust.general_notes_ph")}
          rows={3}
          className="min-h-[80px]"
          disabled={pending}
        />
        {isDirty && (
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNotes(initialNotes)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="me-1.5 size-3.5 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TagsSection({
  customerId,
  tags: initialTags,
  t,
  onRefresh,
}: {
  customerId: string;
  tags: string[];
  t: ReturnType<typeof useT>;
  onRefresh: () => void;
}) {
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState("");
  const [pending, startTransition] = useTransition();

  function saveTags(next: string[]) {
    setTags(next);
    startTransition(async () => {
      await updateCustomerTags(customerId, next);
      onRefresh();
    });
  }

  function handleAdd() {
    const val = newTag.trim();
    if (!val || tags.includes(val)) return;
    setNewTag("");
    saveTags([...tags, val]);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("cust.tags")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pe-1.5">
              {tag}
              <button
                type="button"
                onClick={() => saveTags(tags.filter((t) => t !== tag))}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                disabled={pending}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-muted-foreground">{t("cust.not_set")}</span>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t("cust.add_tag_ph")}
            className="max-w-xs h-9"
            disabled={pending}
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending || !newTag.trim()} className="h-9">
            <Plus className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotesFeedSection({
  customerId,
  businessId,
  notes,
  locale,
  t,
  onRefresh,
}: {
  customerId: string;
  businessId: string;
  notes: CustomerProfile["notes"];
  locale: string;
  t: ReturnType<typeof useT>;
  onRefresh: () => void;
}) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addCustomerNote(customerId, businessId, content);
      if (result.success) {
        setContent("");
        onRefresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("cust.notes_feed")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("cust.note_ph")}
            rows={3}
            disabled={pending}
          />
          <Button type="submit" size="sm" disabled={pending || !content.trim()} className="gap-1.5">
            <Send className="size-3.5" />
            {t("cust.add_note")}
          </Button>
        </form>

        <Separator />

        {notes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <StickyNote className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("cust.no_notes")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{note.authorName}</span>
                  <time>
                    {new Date(note.createdAt).toLocaleDateString(
                      locale === "he" ? "he-IL" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </time>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
