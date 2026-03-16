import { LocaleProvider } from "@/lib/i18n/locale-context";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider locale="he">
      <div className="min-h-screen bg-background" dir="rtl">{children}</div>
    </LocaleProvider>
  );
}
