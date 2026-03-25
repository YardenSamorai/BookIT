import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";
import { CalendarCheck } from "lucide-react";

interface SiteBookingProps {
  content?: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  bookingUrl: string;
  locale: Locale;
}

export function SiteBooking({
  content = {},
  theme,
  sectionIndex,
  bookingUrl,
  locale,
}: SiteBookingProps) {
  const title =
    (content.title as string) || t(locale, "pub.booking_section_title");
  const subtitle =
    (content.subtitle as string) || t(locale, "pub.booking_section_subtitle");
  const buttonText =
    (content.button_text as string) || t(locale, "pub.book_now");

  return (
    <section
      id="booking"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div
          className={`${theme.card} ${theme.radius.lg} px-6 py-10 sm:px-10 sm:py-14`}
        >
          <div
            className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${theme.secondaryColor}15` }}
          >
            <CalendarCheck
              size={24}
              style={{ color: theme.secondaryColor }}
            />
          </div>

          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="mx-auto mt-3 max-w-md text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--section-body, #6b7280)" }}
            >
              {subtitle}
            </p>
          )}

          <div className="mt-8">
            <a
              href={bookingUrl}
              className={`inline-block px-8 py-3.5 text-base text-white ${theme.buttonClasses}`}
              style={
                theme.preset.buttonStyle === "gradient"
                  ? {
                      background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
                    }
                  : { backgroundColor: theme.secondaryColor }
              }
            >
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
