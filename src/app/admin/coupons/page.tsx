import { getCoupons } from "@/actions/admin";
import { AdminCouponsClient } from "@/components/admin/admin-coupons-client";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const couponRows = await getCoupons();
  return <AdminCouponsClient coupons={couponRows} />;
}
