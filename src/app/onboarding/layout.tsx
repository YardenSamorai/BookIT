import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <LocaleProvider locale="he">
      <div className="flex min-h-svh flex-col bg-muted/30" dir="rtl">
        {children}
      </div>
    </LocaleProvider>
  );
}
