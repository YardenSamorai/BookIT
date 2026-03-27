import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div dir="rtl">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminTopbar userName={session.user.name || "Admin"} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
