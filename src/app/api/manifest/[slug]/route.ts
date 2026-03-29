import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: {
      name: true,
      displayName: true,
      logoUrl: true,
      primaryColor: true,
      language: true,
    },
  });

  if (!business) {
    business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.customSubdomain, slug),
        eq(businesses.subdomainStatus, "APPROVED")
      ),
      columns: {
        name: true,
        displayName: true,
        logoUrl: true,
        primaryColor: true,
        language: true,
      },
    });
  }

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = business.displayName || business.name;
  const themeColor = business.primaryColor || "#4f46e5";
  const lang = business.language || "he";

  const icons = business.logoUrl
    ? [
        { src: business.logoUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: business.logoUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ]
    : [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ];

  const manifest = {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    start_url: `/b/${slug}`,
    display: "standalone",
    orientation: "portrait",
    theme_color: themeColor,
    background_color: "#ffffff",
    dir: lang === "he" ? "rtl" : "ltr",
    lang,
    icons,
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
