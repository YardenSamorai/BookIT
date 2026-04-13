import type { Metadata, Viewport } from "next";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

const BIZ_COLS = {
  name: true,
  displayName: true,
  logoUrl: true,
  primaryColor: true,
} as const;

async function getBusiness(slug: string) {
  let business = await db.query.businesses.findFirst({
    where: and(eq(businesses.slug, slug), ne(businesses.subscriptionStatus, "CANCELLED")),
    columns: BIZ_COLS,
  });

  if (!business) {
    business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
      columns: BIZ_COLS,
    });
  }

  if (!business) {
    business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.customSubdomain, slug),
        eq(businesses.subdomainStatus, "APPROVED"),
        ne(businesses.subscriptionStatus, "CANCELLED"),
      ),
      columns: BIZ_COLS,
    });
  }

  if (!business) {
    business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.customSubdomain, slug),
        eq(businesses.subdomainStatus, "APPROVED"),
      ),
      columns: BIZ_COLS,
    });
  }

  return business;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) return {};

  const name = business.displayName || business.name;
  const appleIcon = business.logoUrl || "/icons/apple-touch-icon.png";

  return {
    manifest: `/api/manifest/${slug}`,
    icons: {
      icon: business.logoUrl || "/icons/icon-192.png",
      apple: appleIcon,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: name,
    },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  return {
    themeColor: business?.primaryColor || "#4f46e5",
  };
}

export default function BusinessSlugLayout({ children }: Props) {
  return children;
}
