"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, CalendarCheck, CreditCard, LogOut } from "lucide-react";
import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface SiteNavProps {
  businessName: string;
  slug: string;
  logoUrl?: string | null;
  bookingUrl?: string;
  basePath?: string;
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

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "usermenu.morning";
  if (hour < 17) return "usermenu.afternoon";
  return "usermenu.evening";
}

const SECTION_NAV_MAP: Record<string, { href: string; labelKey: string }> = {
  about: { href: "#about", labelKey: "pub.about" },
  services: { href: "#services", labelKey: "section.services" },
  team: { href: "#team", labelKey: "pub.team" },
  contact: { href: "#contact", labelKey: "pub.contact_us" },
};

const USER_MENU_ITEMS = [
  { key: "usermenu.profile", icon: User, tab: "profile" },
  { key: "usermenu.my_appointments", icon: CalendarCheck, tab: "appointments" },
  { key: "usermenu.card", icon: CreditCard, tab: "packages" },
] as const;

function UserMenuDropdown({
  userName,
  avatarSize = "md",
  showGreeting = false,
  accentColor,
  textColorClass,
  basePath,
  locale,
}: {
  userName: string | null | undefined;
  avatarSize?: "sm" | "md";
  showGreeting?: boolean;
  accentColor: string;
  textColorClass?: string;
  basePath: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const myAppointmentsUrl = `${basePath}/my-appointments`;
  const greeting = t(locale, getGreetingKey() as Parameters<typeof t>[1]);
  const firstName = getFirstName(userName);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const sz = avatarSize === "sm" ? "size-6 text-[10px]" : "size-7 text-[11px]";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        {showGreeting && firstName && (
          <span className={`text-sm font-medium ${textColorClass ?? ""}`}>
            {greeting}, {firstName}
          </span>
        )}
        <span
          className={`flex items-center justify-center rounded-full font-bold text-white ${sz}`}
          style={{ backgroundColor: accentColor }}
        >
          {getInitials(userName)}
        </span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {USER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.key}
                href={`${myAppointmentsUrl}?tab=${item.tab}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Icon size={16} className="shrink-0 text-gray-400" />
                {t(locale, item.key as Parameters<typeof t>[1])}
              </a>
            );
          })}
          <div className="my-1 h-px bg-gray-100" />
          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: basePath || "/" });
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} className="shrink-0" />
            {t(locale, "usermenu.logout" as Parameters<typeof t>[1])}
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteNav({
  businessName,
  slug,
  logoUrl,
  bookingUrl = "#services",
  basePath,
  theme,
  locale,
  enabledSections,
}: SiteNavProps) {
  const resolvedBase = basePath ?? `/b/${slug}`;
  const NAV_LINKS = (enabledSections ?? Object.keys(SECTION_NAV_MAP))
    .filter((s) => SECTION_NAV_MAP[s])
    .map((s) => ({
      href: SECTION_NAV_MAP[s].href,
      label: t(locale, SECTION_NAV_MAP[s].labelKey as Parameters<typeof t>[1]),
    }));
  const myAppointmentsUrl = `${resolvedBase}/my-appointments`;
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const userName = session?.user?.name;

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
        <a href={resolvedBase || "/"} className="flex items-center gap-3 transition-opacity hover:opacity-80">
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
        </a>

        {/* Desktop nav */}
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
            <UserMenuDropdown
              userName={userName}
              avatarSize="md"
              showGreeting
              accentColor={theme.secondaryColor}
              textColorClass={textColor}
              basePath={resolvedBase}
              locale={locale}
            />
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

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && (
            <UserMenuDropdown
              userName={userName}
              avatarSize="sm"
              showGreeting
              accentColor={theme.secondaryColor}
              textColorClass={textColor}
              basePath={resolvedBase}
              locale={locale}
            />
          )}
        </div>
      </div>

    </nav>
  );
}
