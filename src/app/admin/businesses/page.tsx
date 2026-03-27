import { getAdminBusinessList } from "@/actions/admin";
import { BusinessesTable } from "@/components/admin/businesses-table";

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinessList();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">עסקים</h1>
      <BusinessesTable businesses={businesses} />
    </div>
  );
}
