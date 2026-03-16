"use client";

import { createContext, useContext } from "react";
import { t as translate, type Locale, type TranslationKey } from "./index";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useContext(LocaleContext);
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
