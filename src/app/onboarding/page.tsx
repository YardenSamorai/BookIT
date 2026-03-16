import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getBusinessByOwnerId } from "@/lib/db/queries/business";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const existing = await getBusinessByOwnerId(session.user.id);
  if (existing) {
    redirect("/dashboard");
  }

  return <OnboardingWizard userName={session.user.name || "there"} />;
}
