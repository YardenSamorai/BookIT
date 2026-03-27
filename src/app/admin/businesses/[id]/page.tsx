import { notFound } from "next/navigation";
import { getAdminBusinessDetail } from "@/actions/admin";
import { BusinessDetailClient } from "@/components/admin/business-detail-client";

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminBusinessDetail(id);

  if (!data) notFound();

  return <BusinessDetailClient data={data} />;
}
