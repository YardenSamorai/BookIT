import { AuthLayout } from "@/components/marketing/auth-layout";
import { LoginForm } from "@/components/marketing/login-form";
import { t } from "@/lib/i18n";

const locale = "he";

export const metadata = {
  title: "Log In — BookIT",
  description: "Log in to your BookIT dashboard.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title={t(locale, "auth.welcome_back")}
      subtitle={t(locale, "auth.login_subtitle")}
    >
      <LoginForm />
    </AuthLayout>
  );
}
