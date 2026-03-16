"use client";

import { useState } from "react";
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
}

export function SiteNav({
  businessName,
  slug,
  logoUrl,
  bookingUrl = "#services",
  theme,
  locale,
}: SiteNavProps) {
  const NAV_LINKS = [
    { href: "#about", label: t(locale, "pub.about") },
    { href: "#services", label: t(locale, "section.services") },
    { href: "#team", label: t(locale, "pub.team") },
    { href: "#contact", label: t(locale, "pub.contact_us") },
  ];
  const myAppointmentsUrl = `/b/${slug}/my-appointments`;
  const myAppointmentsLabel = t(locale, "myapt.title");
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
          <a
            href={myAppointmentsUrl}
            className={`text-sm transition-colors ${textMuted}`}
          >
            {myAppointmentsLabel}
          </a>
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
            <a
              href={myAppointmentsUrl}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isWhite
                  ? "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {myAppointmentsLabel}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
