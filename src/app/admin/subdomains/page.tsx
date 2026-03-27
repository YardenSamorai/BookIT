import { getSubdomainRequests, getPendingSubdomainCount } from "@/actions/subdomain";
import { AdminSubdomainsClient } from "@/components/admin/admin-subdomains-client";

export default async function AdminSubdomainsPage() {
  const [requests, pendingCount] = await Promise.all([
    getSubdomainRequests(),
    getPendingSubdomainCount(),
  ]);

  return <AdminSubdomainsClient requests={requests} pendingCount={pendingCount} />;
}
