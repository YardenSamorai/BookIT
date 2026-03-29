import { AuthLayout } from "@/components/marketing/auth-layout";
import { ForgotPasswordForm } from "@/components/marketing/forgot-password-form";
import { t } from "@/lib/i18n";

const locale = "he";

export const metadata = {
  title: "Reset Password — BookIT",
  description: "Reset your BookIT account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title={t(locale, "auth.reset_title" as never)}
      subtitle={t(locale, "auth.reset_subtitle" as never)}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
