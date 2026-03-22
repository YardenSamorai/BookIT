"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerProfile } from "@/lib/db/queries/customers";

const STATUS_BADGE: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-600",
  BLOCKED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

interface Props {
  customer: CustomerProfile;
  onEdit: () => void;
}

export function ProfileTab({ customer, onEdit }: Props) {
  const t = useT();
  const locale = useLocale();

  const formatDate = (d: string | Date | null) => {
    if (!d) return t("cust.not_set");
    return new Date(d).toLocaleDateString(
      locale === "he" ? "he-IL" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const sections: Array<{
    title: string;
    fields: Array<{ label: string; value: React.ReactNode }>;
  }> = [
    {
      title: t("cust.personal"),
      fields: [
        { label: t("cust.col_name"), value: customer.name },
        { label: t("cust.phone"), value: customer.phone ? <span dir="ltr">{customer.phone}</span> : null },
        { label: t("cust.email"), value: customer.email },
        { label: t("cust.birthday"), value: customer.birthday ? formatDate(customer.birthday) : null },
        { label: t("cust.gender"), value: customer.gender ? t(`cust.gender_${customer.gender}` as Parameters<typeof t>[0]) : null },
      ],
    },
    {
      title: t("cust.contact_info"),
      fields: [
        { label: t("cust.address"), value: customer.address },
        { label: t("cust.preferred_language"), value: customer.preferredLanguage ? t(`cust.language_${customer.preferredLanguage}` as Parameters<typeof t>[0]) : null },
      ],
    },
    {
      title: t("cust.source_acquisition"),
      fields: [
        { label: t("cust.source_acquisition"), value: customer.source },
      ],
    },
    {
      title: t("cust.comm_preferences"),
      fields: [
        { label: t("cust.sms_opt_in"), value: <Badge variant={customer.smsOptIn ? "default" : "secondary"}>{customer.smsOptIn ? "✓" : "✗"}</Badge> },
        { label: t("cust.whatsapp_opt_in"), value: <Badge variant={customer.whatsappOptIn ? "default" : "secondary"}>{customer.whatsappOptIn ? "✓" : "✗"}</Badge> },
        { label: t("cust.email_marketing_opt_in"), value: <Badge variant={customer.emailMarketingOptIn ? "default" : "secondary"}>{customer.emailMarketingOptIn ? "✓" : "✗"}</Badge> },
        {
          label: t("cust.reminder_channel"),
          value: customer.reminderChannel
            ? t(`cust.reminder_${customer.reminderChannel}` as Parameters<typeof t>[0])
            : t("cust.reminder_default"),
        },
      ],
    },
    {
      title: t("cust.system_info"),
      fields: [
        { label: t("cust.customer_id"), value: <span className="font-mono text-xs">{customer.id.slice(0, 8)}...</span> },
        { label: t("cust.join_date"), value: formatDate(customer.createdAt) },
        { label: t("cust.last_updated"), value: formatDate(customer.updatedAt) },
        {
          label: t("cust.lifecycle_status"),
          value: (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[customer.status] ?? ""}`}>
              {t(`cust.status_${customer.status.toLowerCase()}` as Parameters<typeof t>[0])}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-3.5 me-1.5" />
          {t("cust.edit_profile")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="text-sm mt-0.5">
                      {field.value ?? <span className="text-muted-foreground">{t("cust.not_set")}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
