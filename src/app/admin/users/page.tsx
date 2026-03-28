import { getAdminUserList } from "@/actions/admin";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
  const users = await getAdminUserList();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">משתמשים</h1>
      <AdminUsersClient users={users} />
    </div>
  );
}
