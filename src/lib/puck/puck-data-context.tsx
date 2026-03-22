"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteTheme } from "@/lib/themes/presets";
import type { Locale } from "@/lib/i18n";

export interface PuckBusinessData {
  businessId: string;
  businessName: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  bookingUrl: string;
  services: Array<Record<string, unknown>>;
  staff: Array<Record<string, unknown>>;
  hours: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  theme: SiteTheme;
  locale: Locale;
}

const PuckBusinessContext = createContext<PuckBusinessData | null>(null);

export function PuckBusinessProvider({
  value,
  children,
}: {
  value: PuckBusinessData;
  children: ReactNode;
}) {
  return (
    <PuckBusinessContext.Provider value={value}>
      {children}
    </PuckBusinessContext.Provider>
  );
}

export function usePuckBusiness(): PuckBusinessData {
  const ctx = useContext(PuckBusinessContext);
  if (!ctx) throw new Error("usePuckBusiness must be used within PuckBusinessProvider");
  return ctx;
}
