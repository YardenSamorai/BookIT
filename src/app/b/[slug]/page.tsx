import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBusinessData } from "@/lib/db/queries/public-site";
import { PublicSite } from "@/components/public-site/public-site";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicBusinessData(slug);

  if (!data) return {};

  const { business, siteConfig } = data;
  const locale = (business.language as Locale) || "he";

  const title = siteConfig?.metaTitle || business.name;
  const description =
    siteConfig?.metaDescription || t(locale, "pub.default_subtitle");
  const image =
    siteConfig?.ogImageUrl || business.coverImageUrl || business.logoUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function PublicBusinessPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicBusinessData(slug);

  if (!data) {
    notFound();
  }

  if (data.business.subscriptionStatus === "CANCELLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            {t((data.business.language as Locale) || "he", "pub.site_suspended" as never)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t((data.business.language as Locale) || "he", "pub.site_suspended_desc" as never)}
          </p>
        </div>
      </div>
    );
  }

  const locale = (data.business.language as Locale) || "he";

  return <PublicSite data={data} locale={locale} />;
}
