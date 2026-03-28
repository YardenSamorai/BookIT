import { getAnnouncements } from "@/actions/admin";
import { AdminAnnouncementsClient } from "@/components/admin/admin-announcements-client";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements();
  return <AdminAnnouncementsClient announcements={announcements} />;
}
