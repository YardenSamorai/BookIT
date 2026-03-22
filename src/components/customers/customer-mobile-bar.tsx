"use client";

import { Phone, MessageCircle, CalendarPlus, CreditCard, StickyNote, Pencil } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { telLink, whatsappLink } from "@/lib/utils/phone";
import type { CustomerProfile } from "@/lib/db/queries/customers";

interface Props {
  customer: CustomerProfile;
  onEdit: () => void;
  onBook: () => void;
  onAssignCard: () => void;
  onSwitchTab: (tab: string) => void;
}

export function CustomerMobileBar({ customer, onEdit, onBook, onAssignCard, onSwitchTab }: Props) {
  const t = useT();

  const actions = [
    customer.phone
      ? { icon: Phone, label: t("cust.call"), href: telLink(customer.phone) }
      : null,
    customer.phone
      ? { icon: MessageCircle, label: t("cust.whatsapp"), href: whatsappLink(customer.phone), external: true }
      : null,
    { icon: CalendarPlus, label: t("cust.book"), onClick: onBook },
    { icon: CreditCard, label: t("cust.card"), onClick: onAssignCard },
    { icon: StickyNote, label: t("cust.note"), onClick: () => onSwitchTab("notes") },
    { icon: Pencil, label: t("cust.edit"), onClick: onEdit },
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    external?: boolean;
    onClick?: () => void;
  }>;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center justify-center size-12 rounded-lg hover:bg-muted transition-colors">
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </div>
          );

          if (action.href) {
            return (
              <a
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
              >
                {content}
              </a>
            );
          }

          return (
            <button key={action.label} type="button" onClick={action.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
