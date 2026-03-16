import { notFound } from "next/navigation";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { PublicSite } from "@/components/public-site/public-site";
import type { Locale } from "@/lib/i18n";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicBusinessPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicBusinessData(slug);

  if (!data) {
    notFound();
  }

  const locale = (data.business.language as Locale) || "he";

  return <PublicSite data={data} locale={locale} />;
}
