import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { PublicSite } from "@/components/public-site/public-site";
import type { Locale } from "@/lib/i18n";

export default async function BookingPage() {
  const headerList = await headers();
  const slug = headerList.get("x-business-slug");

  if (!slug) {
    notFound();
  }

  const data = await getPublicBusinessData(slug);

  if (!data) {
    notFound();
  }

  const locale = (data.business.language as Locale) || "he";

  return <PublicSite data={data} locale={locale} />;
}
