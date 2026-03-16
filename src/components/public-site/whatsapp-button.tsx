"use client";

import { MessageCircle } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  locale: Locale;
}

export function WhatsAppButton({ phone, message, locale }: WhatsAppButtonProps) {
  const defaultMessage = message ?? t(locale, "pub.wa_message");
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  if (!cleanPhone) return null;

  const url = `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl sm:size-16"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="size-7 sm:size-8" />
    </a>
  );
}
