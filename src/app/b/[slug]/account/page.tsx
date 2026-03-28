import { headers } from "next/headers";
import { redirect } from "next/navigation";

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000").replace(/^www\./, "").split(":")[0];

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { slug } = await params;
  const headersList = await headers();
  const host = (headersList.get("host") || "").split(":")[0];
  const isSubdomain = host !== APP_DOMAIN && host !== `www.${APP_DOMAIN}` && host.endsWith(APP_DOMAIN);
  const basePath = isSubdomain ? "" : `/b/${slug}`;
  redirect(`${basePath}/my-appointments`);
}
