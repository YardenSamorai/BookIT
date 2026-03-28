import { auth } from "@/lib/auth/config";
import { getAdminUsers } from "@/actions/admin";
import { AdminPermissionsClient } from "@/components/admin/admin-permissions-client";

export default async function AdminPermissionsPage() {
  const [session, admins] = await Promise.all([auth(), getAdminUsers()]);

  return (
    <AdminPermissionsClient
      admins={admins}
      currentUserId={session?.user?.id ?? ""}
    />
  );
}
