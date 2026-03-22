"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface SiteNavProps {
  businessName: string;
  slug: string;
  logoUrl?: string | null;
  bookingUrl?: string;
  theme: SiteTheme;
  locale: Locale;
  enabledSections?: string[];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0]?.toUpperCase() || "?";
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

const SECTION_NAV_MAP: Record<string, { href: string; labelKey: string }> = {
  about: { href: "#about", labelKey: "pub.about" },
  services: { href: "#services", labelKey: "section.services" },
  team: { href: "#team", labelKey: "pub.team" },
  contact: { href: "#contact", labelKey: "pub.contact_us" },
};

export function SiteNav({
  businessName,
  slug,
  logoUrl,
  bookingUrl = "#services",
  theme,
  locale,
  enabledSections,
}: SiteNavProps) {
  const NAV_LINKS = (enabledSections ?? Object.keys(SECTION_NAV_MAP))
    .filter((s) => SECTION_NAV_MAP[s])
    .map((s) => ({
      href: SECTION_NAV_MAP[s].href,
      label: t(locale, SECTION_NAV_MAP[s].labelKey as Parameters<typeof t>[1]),
    }));
  const myAppointmentsUrl = `/b/${slug}/my-appointments`;
  const myAppointmentsLabel = t(locale, "portal.login_title");
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const userName = session?.user?.name;

  const [mobileOpen, setMobileOpen] = useState(false);
  const isWhite = theme.preset.navStyle === "white";
  const isTransparent = theme.preset.navStyle === "transparent";

  const navBg = isWhite
    ? "bg-white"
    : isTransparent
      ? ""
      : `backdrop-blur-md`;

  const navBgStyle: React.CSSProperties = isWhite || isTransparent
    ? {}
    : { backgroundColor: `${theme.primaryColor}ee` };

  const textColor = isWhite ? "text-gray-900" : "text-white";
  const textMuted = isWhite ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white";

  return (
    <nav
      className={`sticky top-0 z-50 ${theme.navClasses} ${navBg}`}
      style={navBgStyle}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={businessName}
              className={`h-7 w-auto ${theme.radius.sm} sm:h-8`}
            />
          )}
          <span className={`text-base font-bold sm:text-lg ${textColor}`}>
            {businessName}
          </span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${textMuted}`}
            >
              {link.label}
            </a>
          ))}
          {isLoggedIn ? (
            <a
              href={myAppointmentsUrl}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span
                className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                {getInitials(userName)}
              </span>
              <span className={`text-sm font-medium ${textColor}`}>
                {getFirstName(userName)}
              </span>
            </a>
          ) : (
            <a
              href={myAppointmentsUrl}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {t(locale, "pub.login")}
            </a>
          )}
          <a
            href={bookingUrl}
            className={`px-5 py-2 text-sm ${theme.buttonClasses}`}
            style={
              theme.preset.buttonStyle === "outline"
                ? { borderColor: theme.secondaryColor, color: theme.secondaryColor }
                : theme.preset.buttonStyle === "gradient"
                  ? { background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})` }
                  : { backgroundColor: theme.secondaryColor }
            }
          >
            {t(locale, "pub.book_now")}
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && (
            <a
              href={myAppointmentsUrl}
              className="flex items-center gap-1.5"
            >
              <span
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                {getInitials(userName)}
              </span>
            </a>
          )}
          <a
            href={bookingUrl}
            className={`px-3 py-1.5 text-xs ${theme.buttonClasses}`}
            style={
              theme.preset.buttonStyle === "outline"
                ? { borderColor: theme.secondaryColor, color: theme.secondaryColor }
                : { backgroundColor: theme.secondaryColor }
            }
          >
            {t(locale, "pub.book")}
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
              isWhite
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className={`px-4 pb-4 pt-2 md:hidden ${
            isWhite ? "border-t border-gray-100 bg-white" : "border-t border-white/10"
          }`}
          style={isWhite ? {} : { backgroundColor: theme.primaryColor }}
        >
          <div className="flex flex-col gap-1">
            {isLoggedIn && (
              <a
                href={myAppointmentsUrl}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                  isWhite
                    ? "bg-gray-50 text-gray-900"
                    : "bg-white/10 text-white"
                }`}
              >
                <span
                  className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  {getInitials(userName)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className={`text-[11px] ${isWhite ? "text-gray-500" : "text-white/60"}`}>
                    {myAppointmentsLabel}
                  </p>
                </div>
              </a>
            )}
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isWhite
                    ? "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
            {!isLoggedIn && (
              <a
                href={myAppointmentsUrl}
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                {t(locale, "pub.login")}
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
