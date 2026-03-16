import { AuthLayout } from "@/components/marketing/auth-layout";
import { SignupForm } from "@/components/marketing/signup-form";
import { t } from "@/lib/i18n";

const locale = "he";

export const metadata = {
  title: "Sign Up — BookIT",
  description: "Create your BookIT account and launch your booking site in minutes.",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title={t(locale, "auth.create_account")}
      subtitle={t(locale, "auth.signup_subtitle")}
    >
      <SignupForm />
    </AuthLayout>
  );
}
