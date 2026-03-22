import type { InferSelectModel } from "drizzle-orm";
import type { businesses, businessHours } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { t as translate, DAYS_KEYS, type Locale } from "@/lib/i18n";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";

type Business = InferSelectModel<typeof businesses>;
type HoursRow = InferSelectModel<typeof businessHours>;

interface SiteContactProps {
  business: Business;
  hours: HoursRow[];
  content?: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  locale: Locale;
}

function buildMapEmbedUrl(address?: string | null): string | undefined {
  if (!address?.trim()) return undefined;
  return `https://maps.google.com/maps?q=${encodeURIComponent(address.trim())}&output=embed&z=15`;
}

export function SiteContact({ business, hours, content = {}, theme, sectionIndex, locale }: SiteContactProps) {
  const hasContactInfo = business.phone || business.email || business.address;
  const title = (content.title as string) || translate(locale, "pub.get_in_touch");
  const layout = (content.layout as string) || "split";
  const use24h = locale === "he";
  const today = new Date().getDay();

  const mapEmbedUrl = buildMapEmbedUrl(business.address);

  const contactInfoBlock = hasContactInfo && (
    <div>
      <h3 className={`mb-4 text-base font-semibold ${theme.font}`} style={{ color: "var(--section-heading, #111827)" }}>
        {translate(locale, "pub.contact_info")}
      </h3>
      <div className="space-y-3">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className={`flex items-center gap-3.5 ${theme.radius.lg} border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md`}
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${theme.secondaryColor}12` }}
            >
              <Phone className="size-4" style={{ color: theme.secondaryColor }} />
            </div>
            <div>
              <p className="text-[11px]" style={{ color: "var(--section-body, #9ca3af)" }}>{translate(locale, "pub.phone")}</p>
              <p className="text-sm font-medium" style={{ color: "var(--section-heading, #111827)" }} dir="ltr">{business.phone}</p>
            </div>
          </a>
        )}
        {business.email && (
          <a
            href={`mailto:${business.email}`}
            className={`flex items-center gap-3.5 ${theme.radius.lg} border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md`}
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${theme.secondaryColor}12` }}
            >
              <Mail className="size-4" style={{ color: theme.secondaryColor }} />
            </div>
            <div>
              <p className="text-[11px]" style={{ color: "var(--section-body, #9ca3af)" }}>{translate(locale, "pub.email")}</p>
              <p className="text-sm font-medium" style={{ color: "var(--section-heading, #111827)" }}>{business.email}</p>
            </div>
          </a>
        )}
        {business.address && (() => {
          const encodedAddress = encodeURIComponent(business.address);
          const wazeUrl = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

          return (
            <div className={`${theme.radius.lg} border border-gray-100 bg-white p-3.5 shadow-sm`}>
              <div className="flex items-center gap-3.5">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${theme.secondaryColor}12` }}
                >
                  <MapPin className="size-4" style={{ color: theme.secondaryColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px]" style={{ color: "var(--section-body, #9ca3af)" }}>{translate(locale, "pub.address")}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--section-heading, #111827)" }}>{business.address}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 ps-[3.375rem]">
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-gray-300 hover:bg-gray-100 hover:shadow-sm"
                  style={{ color: "var(--section-body, #374151)" }}
                >
                  <Navigation className="size-3.5" style={{ color: theme.secondaryColor }} />
                  {translate(locale, "pub.open_waze")}
                </a>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium transition-all hover:border-gray-300 hover:bg-gray-100 hover:shadow-sm"
                  style={{ color: "var(--section-body, #374151)" }}
                >
                  <MapPin className="size-3.5" style={{ color: theme.secondaryColor }} />
                  {translate(locale, "pub.open_google_maps")}
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const hoursBlock = (
    <div>
      <h3 className={`mb-4 text-base font-semibold ${theme.font}`} style={{ color: "var(--section-heading, #111827)" }}>
        {translate(locale, "pub.business_hours")}
      </h3>
      <div className={`overflow-hidden ${theme.radius.lg} border border-gray-100 bg-white shadow-sm`}>
        {Array.from({ length: 7 }, (_, i) => {
          const row = hours.find((h) => h.dayOfWeek === i);
          const isToday = i === today;
          return (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i < 6 ? "border-b border-gray-50" : ""
              } ${isToday ? "bg-gray-50" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                {isToday && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                )}
                <span
                  className="font-medium"
                  style={{ color: isToday ? "var(--section-heading, #111827)" : "var(--section-body, #4b5563)" }}
                >
                  {translate(locale, DAYS_KEYS[i])}
                </span>
              </div>
              {row?.isOpen ? (
                <span
                  className="font-medium tabular-nums"
                  style={{ color: isToday ? "var(--section-heading, #111827)" : "var(--section-body, #6b7280)" }}
                  dir="ltr"
                >
                  {formatTime(row.startTime, use24h)} – {formatTime(row.endTime, use24h)}
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-300">
                  {translate(locale, "pub.closed")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const mapBlock = mapEmbedUrl && (
    <div className={`overflow-hidden ${theme.imageRadius} border border-gray-100`}>
      <iframe
        src={mapEmbedUrl}
        className="h-72 w-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Business location"
      />
    </div>
  );

  return (
    <section
      id="contact"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md" style={{ color: "var(--section-body, #6b7280)" }}>
            {translate(locale, "pub.contact_intro")}
          </p>
        </div>

        {layout === "stacked" && (
          <div className="mt-10 space-y-8 sm:mt-12 max-w-xl mx-auto">
            {contactInfoBlock}
            {hoursBlock}
            {mapBlock && <div className="mt-8">{mapBlock}</div>}
          </div>
        )}

        {layout === "with_map" && (
          <div className="mt-10 sm:mt-12 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-8">
                {contactInfoBlock}
                {hoursBlock}
              </div>
              {mapBlock ? (
                <div className="flex flex-col justify-center">
                  {mapBlock}
                </div>
              ) : (
                hoursBlock ? null : contactInfoBlock
              )}
            </div>
          </div>
        )}

        {layout === "split" && (
          <>
            <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2 lg:gap-12">
              {contactInfoBlock}
              {hoursBlock}
            </div>
            {mapBlock && <div className="mt-12">{mapBlock}</div>}
          </>
        )}

        {!["split", "stacked", "with_map"].includes(layout) && (
          <>
            <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2 lg:gap-12">
              {contactInfoBlock}
              {hoursBlock}
            </div>
            {mapBlock && <div className="mt-12">{mapBlock}</div>}
          </>
        )}
      </div>
    </section>
  );
}

function formatTime(time: string, use24h: boolean): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);

  if (use24h) {
    return `${String(hour).padStart(2, "0")}:${m}`;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${suffix}`;
}
