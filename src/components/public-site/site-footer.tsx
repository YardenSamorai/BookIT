import type { SiteTheme } from "@/lib/themes/presets";
import type { SocialLinks } from "@/lib/db/schema/site-config";
import { Globe, MessageCircle, Youtube, Linkedin } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

interface SiteFooterProps {
  businessName: string;
  theme: SiteTheme;
  socialLinks?: SocialLinks;
  locale: Locale;
  removeBranding?: boolean;
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: Globe,
  facebook: Globe,
  tiktok: Globe,
  twitter: Globe,
  youtube: Youtube,
  linkedin: Linkedin,
  website: Globe,
  whatsapp: MessageCircle,
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "Twitter",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  website: "Website",
};

export function SiteFooter({ businessName, theme, socialLinks = {}, locale, removeBranding = false }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const links = Object.entries(socialLinks)
    .filter(([key, val]) => val && key !== "whatsapp")
    .map(([key, val]) => ({
      key,
      url: val as string,
      label: SOCIAL_LABELS[key] || key,
      Icon: SOCIAL_ICONS[key] || Globe,
    }));

  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      {links.length > 0 && (
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-6 pt-6">
          {links.map(({ key, url, label, Icon }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              aria-label={label}
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      )}

      <div className="py-6 text-center">
        <p className="text-sm text-gray-500">
          &copy; {year} {businessName}. {t(locale, "pub.all_rights")}
        </p>
        {!removeBranding && (
          <p className="mt-1 text-xs text-gray-400">
            {t(locale, "pub.powered_by")}
          </p>
        )}
      </div>
    </footer>
  );
}
