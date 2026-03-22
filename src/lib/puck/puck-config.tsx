import type { Config } from "@puckeditor/core";
import type { ReactNode } from "react";
import { SiteHero } from "@/components/public-site/site-hero";
import { SiteAbout } from "@/components/public-site/site-about";
import { SiteServices } from "@/components/public-site/site-services";
import { SiteTeam } from "@/components/public-site/site-team";
import { SiteGallery } from "@/components/public-site/site-gallery";
import { SiteTestimonials } from "@/components/public-site/site-testimonials";
import { SiteCtaBanner } from "@/components/public-site/site-cta-banner";
import { SiteContact } from "@/components/public-site/site-contact";
import { SiteProducts } from "@/components/public-site/site-products";
import { ImageUpload } from "@/components/shared/image-upload";
import { usePuckBusiness } from "./puck-data-context";
import { getDir } from "@/lib/i18n";
import {
  HERO_BACKGROUNDS,
  HERO_FONT_STYLES,
  HERO_TEXT_SIZES,
  getHeroBackground,
} from "@/lib/themes/hero-backgrounds";
import { COLOR_PALETTES, type ColorPalette } from "@/lib/themes/presets";

function RootRenderer({ children, color_palette }: { children: ReactNode; color_palette?: string }) {
  const biz = usePuckBusiness();
  const dir = getDir(biz.locale);
  const palette = COLOR_PALETTES.find((p) => p.id === color_palette);

  const rootStyle: React.CSSProperties & Record<string, string> = {};
  if (palette) {
    rootStyle.backgroundColor = palette.colors.background;
    rootStyle["--section-heading"] = palette.colors.heading;
    rootStyle["--section-body"] = palette.colors.textMuted;
    rootStyle["--palette-primary"] = palette.colors.primary;
    rootStyle["--palette-secondary"] = palette.colors.secondary;
    rootStyle["--palette-accent"] = palette.colors.accent;
    rootStyle["--palette-surface"] = palette.colors.surface;
    rootStyle["--palette-text"] = palette.colors.text;
    rootStyle["--palette-bg"] = palette.colors.background;
  } else {
    rootStyle.backgroundColor = "#ffffff";
  }

  return (
    <div dir={dir} className={`min-h-full ${biz.theme.font}`} style={rootStyle}>
      {children}
    </div>
  );
}

function SectionBgWrapper({
  bgPresetId,
  bgOverlay,
  children,
}: {
  bgPresetId?: string;
  bgOverlay?: number;
  children: ReactNode;
}) {
  if (!bgPresetId) return <>{children}</>;

  const bg = getHeroBackground(bgPresetId);
  if (!bg) return <>{children}</>;

  const isImage = bg.type === "image" && bg.imageUrl;
  const isCss = bg.type === "css" && bg.css;
  const overlay = bgOverlay ?? 0;

  return (
    <div className="section-custom-bg relative overflow-hidden">
      {isImage && (
        <img
          src={bg.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {isCss && (
        <div className="absolute inset-0" style={bg.css} />
      )}
      {overlay > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "black", opacity: overlay }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function withSectionBg(props: Record<string, unknown>, node: ReactNode) {
  const bgPresetId = props.section_bg as string | undefined;
  const bgOverlay = parseFloat((props.section_bg_overlay as string) ?? "0");
  const headingColor = (props.section_heading_color as string) || undefined;
  const bodyColor = (props.section_body_color as string) || undefined;

  const styleVars: React.CSSProperties & Record<string, string> = {};
  if (headingColor) styleVars["--section-heading"] = headingColor;
  if (bodyColor) styleVars["--section-body"] = bodyColor;
  const hasVars = headingColor || bodyColor;

  const wrapped = bgPresetId ? (
    <SectionBgWrapper bgPresetId={bgPresetId} bgOverlay={bgOverlay}>
      {node}
    </SectionBgWrapper>
  ) : node;

  if (!hasVars) return wrapped;

  return <div style={styleVars}>{wrapped}</div>;
}

function HeroBlock(props: Record<string, unknown>) {
  const biz = usePuckBusiness();
  return (
    <SiteHero
      businessName={biz.businessName}
      coverImageUrl={biz.coverImageUrl}
      content={props}
      theme={biz.theme}
      locale={biz.locale}
    />
  );
}

function AboutBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteAbout
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 1}
      locale={biz.locale}
    />
  );
}

function ServicesBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteServices
      services={biz.services as any}
      currency={biz.currency}
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 2}
      bookingUrl={biz.bookingUrl}
      locale={biz.locale}
    />
  );
}

function TeamBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteTeam
      staff={biz.staff as any}
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 3}
      locale={biz.locale}
    />
  );
}

function GalleryBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteGallery
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 4}
      locale={biz.locale}
    />
  );
}

function TestimonialsBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteTestimonials
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 5}
      locale={biz.locale}
    />
  );
}

function CtaBannerBlock(props: Record<string, unknown>) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteCtaBanner
      content={props}
      theme={biz.theme}
      bookingUrl={biz.bookingUrl}
      locale={biz.locale}
    />
  );
}

function ContactBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteContact
      business={{
        name: biz.businessName,
        slug: biz.slug,
        primaryColor: biz.primaryColor,
        secondaryColor: biz.secondaryColor,
        phone: biz.phone,
        email: biz.email,
        address: biz.address,
      } as any}
      hours={biz.hours as any}
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 7}
      locale={biz.locale}
    />
  );
}

function ProductsBlock(props: Record<string, unknown> & { _sectionIndex?: number }) {
  const biz = usePuckBusiness();
  return withSectionBg(props,
    <SiteProducts
      products={biz.products as any}
      currency={biz.currency}
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 6}
      bookingUrl={biz.bookingUrl}
      locale={biz.locale}
      businessId={biz.businessId}
    />
  );
}

const bgPresetOptions = HERO_BACKGROUNDS.filter((b) => b.type === "image")
  .slice(0, 40)
  .map((b) => ({ label: b.name, value: b.id }));

const bgCssOptions = HERO_BACKGROUNDS.filter((b) => b.type === "css").map((b) => ({
  label: b.name,
  value: b.id,
}));

const allBgOptions = [
  { label: "— None —", value: "" },
  ...bgPresetOptions,
  ...bgCssOptions,
];

const allSectionBgOptions = allBgOptions;

function sectionBgFields(locale: L) {
  return {
    section_bg: {
      type: "select" as const,
      label: l("section_bg", locale),
      options: allSectionBgOptions,
    },
    section_bg_overlay: {
      type: "select" as const,
      label: l("section_overlay", locale),
      options: [
        { label: l("none_overlay", locale), value: "0" },
        { label: l("very_light", locale),   value: "0.15" },
        { label: l("light", locale),         value: "0.3" },
        { label: l("medium", locale),        value: "0.5" },
        { label: l("heavy", locale),         value: "0.7" },
      ],
    },
    section_heading_color: {
      type: "custom" as const,
      label: l("heading_color", locale),
      render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || "#111827"}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-300 p-0.5"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#111827"
            className="h-8 flex-1 rounded border border-gray-300 px-2 text-xs font-mono"
          />
          {value && (
            <button
              onClick={() => onChange("")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      ),
    },
    section_body_color: {
      type: "custom" as const,
      label: l("body_color", locale),
      render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || "#4b5563"}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-300 p-0.5"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#4b5563"
            className="h-8 flex-1 rounded border border-gray-300 px-2 text-xs font-mono"
          />
          {value && (
            <button
              onClick={() => onChange("")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      ),
    },
  };
}

const sectionBgDefaults = {
  section_bg: "",
  section_bg_overlay: "0",
  section_heading_color: "",
  section_body_color: "",
};

const fontStyleOptions = HERO_FONT_STYLES.map((f) => ({
  label: f.name,
  value: f.id,
}));

const textSizeOptions = HERO_TEXT_SIZES.map((s) => ({
  label: s.name,
  value: s.id,
}));

type L = "he" | "en";
const i = (he: string, en: string) => ({ he, en });

const labels = {
  cat_hero:        i("גיבור", "Hero"),
  cat_content:     i("תוכן", "Content"),
  cat_business:    i("עסק", "Business"),
  cat_promotion:   i("קידום", "Promotion"),

  hero:            i("באנר ראשי", "Hero Banner"),
  about:           i("אודות", "About Section"),
  services:        i("שירותים", "Services"),
  team:            i("צוות", "Team"),
  gallery:         i("גלריה", "Gallery"),
  testimonials:    i("המלצות", "Testimonials"),
  cta_banner:      i("באנר קריאה לפעולה", "CTA Banner"),
  contact:         i("יצירת קשר", "Contact"),
  products:        i("מוצרים", "Products"),

  headline:        i("כותרת", "Headline"),
  subtitle:        i("תת כותרת", "Subtitle"),
  title:           i("כותרת", "Title"),
  description:     i("תיאור", "Description"),
  image_url:       i("קישור תמונה", "Image URL"),
  cta_text:        i("טקסט כפתור ראשי", "CTA Button Text"),
  cta_secondary:   i("טקסט כפתור משני", "Secondary Button Text"),
  background:      i("רקע", "Background"),
  overlay:         i("שכבת כיסוי", "Overlay"),
  font_style:      i("סגנון גופן", "Font Style"),
  text_size:       i("גודל טקסט", "Text Size"),
  alignment:       i("יישור", "Alignment"),
  layout:          i("פריסה", "Layout"),
  show_badge:      i("הצג תג", "Show Badge"),
  text_align:      i("יישור טקסט", "Text Alignment"),
  highlight:       i("הדגשה", "Highlight"),
  card_layout:     i("תצוגת כרטיסים", "Card Layout"),
  show_prices:     i("הצג מחירים", "Show Prices"),
  show_duration:   i("הצג משך", "Show Duration"),
  card_style:      i("סגנון כרטיס", "Card Style"),
  show_bio:        i("הצג ביוגרפיה", "Show Bio"),
  columns:         i("עמודות", "Columns"),
  button_text:     i("טקסט כפתור", "Button Text"),
  button_link:     i("קישור כפתור", "Button Link"),
  bg_style:        i("סגנון רקע", "Background Style"),
  bg_mode:         i("מצב רקע", "Background Mode"),
  bg_upload:       i("העלאת תמונה", "Upload Image"),
  bg_presets:      i("תמונות מוכנות", "Presets"),
  bg_image:        i("תמונת רקע", "Background Image"),
  section_bg:      i("רקע סקשן", "Section Background"),
  section_overlay: i("כיסוי סקשן", "Section Overlay"),
  heading_color:   i("צבע כותרת", "Heading Color"),
  body_color:      i("צבע טקסט", "Body Text Color"),
  color_palette:   i("פלטת צבעים", "Color Palette"),
  no_bg:           i("ללא רקע", "No Background"),
  map_url:         i("קישור מפת גוגל", "Google Maps Embed URL"),

  yes:             i("כן", "Yes"),
  no:              i("לא", "No"),
  left:            i("שמאל", "Left"),
  center:          i("מרכז", "Center"),
  right:           i("ימין", "Right"),
  full_width:      i("רוחב מלא", "Full Width"),
  split:           i("מפוצל", "Split"),
  stacked:         i("מוערם", "Stacked"),
  with_map:        i("עם מפה", "With Map"),
  grid:            i("רשת", "Grid"),
  list:            i("רשימה", "List"),
  compact:         i("קומפקטי", "Compact"),
  photo:           i("תמונה", "Photo"),
  avatar:          i("אווטאר", "Avatar"),
  minimal:         i("מינימלי", "Minimal"),
  masonry:         i("מוזאיקה", "Masonry"),
  carousel:        i("קרוסלה", "Carousel"),
  cards:           i("כרטיסים", "Cards"),
  slider:          i("סליידר", "Slider"),
  gradient:        i("גרדיאנט", "Gradient"),
  solid:           i("אחיד", "Solid"),
  centered:        i("ממורכז", "Centered"),
  left_aligned:    i("יישור שמאל", "Left Aligned"),
  right_aligned:   i("יישור ימין", "Right Aligned"),
  none_overlay:    i("ללא", "None"),
  very_light:      i("קל מאוד", "Very Light"),
  light:           i("קל", "Light"),
  medium:          i("בינוני", "Medium"),
  heavy:           i("כבד", "Heavy"),
  very_heavy:      i("כבד מאוד", "Very Heavy"),
  col2:            i("2 עמודות", "2 Columns"),
  col3:            i("3 עמודות", "3 Columns"),
  col4:            i("4 עמודות", "4 Columns"),
};

const l = (key: keyof typeof labels, locale: L) => labels[key][locale];

function PalettePicker({ value, onChange, locale }: { value: string; onChange: (v: string) => void; locale: L }) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onChange("")}
        className={`flex w-full items-center gap-2 rounded-lg border-2 p-2 text-xs transition-all ${
          !value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex gap-0.5">
          <div className="size-5 rounded bg-white border border-gray-200" />
          <div className="size-5 rounded bg-gray-50" />
          <div className="size-5 rounded bg-gray-100" />
          <div className="size-5 rounded bg-gray-200" />
        </div>
        <span className="font-medium">{locale === "he" ? "ברירת מחדל" : "Default"}</span>
      </button>
      {COLOR_PALETTES.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`flex w-full items-center gap-2 rounded-lg border-2 p-2 text-xs transition-all ${
            value === p.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex gap-0.5">
            {p.preview.map((c, i) => (
              <div key={i} className="size-5 rounded" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="font-medium">{p.name[locale]}</span>
        </button>
      ))}
    </div>
  );
}

export function buildPuckConfig(locale: L): Config {
  return {
    root: {
      fields: {
        color_palette: {
          type: "custom" as const,
          label: l("color_palette", locale),
          render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
            <PalettePicker value={value ?? ""} onChange={onChange} locale={locale} />
          ),
        },
      },
      defaultProps: {
        color_palette: "",
      },
      render: ({ children, color_palette }: { children: ReactNode; color_palette?: string }) => (
        <RootRenderer color_palette={color_palette}>{children}</RootRenderer>
      ),
    },
    categories: {
      hero:      { title: l("cat_hero", locale),      components: ["Hero"] },
      content:   { title: l("cat_content", locale),    components: ["About", "Gallery"] },
      business:  { title: l("cat_business", locale),   components: ["Services", "Team", "Contact", "Products"] },
      promotion: { title: l("cat_promotion", locale),  components: ["CtaBanner", "Testimonials"] },
    },
    components: {
      Hero: {
        label: l("hero", locale),
        fields: {
          headline:           { type: "text",     label: l("headline", locale) },
          subtitle:           { type: "textarea", label: l("subtitle", locale) },
          cta_text:           { type: "text",     label: l("cta_text", locale) },
          cta_secondary_text: { type: "text",     label: l("cta_secondary", locale) },
          bg_mode: {
            type: "radio",
            label: l("bg_mode", locale),
            options: [
              { label: l("bg_upload", locale),  value: "upload" },
              { label: l("bg_presets", locale), value: "preset" },
            ],
          },
          background_image: {
            type: "custom",
            label: l("bg_image", locale),
            render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
              <ImageUpload
                value={value ?? ""}
                onChange={onChange}
                folder="hero"
                aspectRatio="banner"
              />
            ),
          },
          bg_preset_id: {
            type: "select",
            label: l("background", locale),
            options: allBgOptions,
          },
          overlay_opacity: {
            type: "select",
            label: l("overlay", locale),
            options: [
              { label: l("none_overlay", locale), value: "0" },
              { label: l("very_light", locale),   value: "0.2" },
              { label: l("light", locale),         value: "0.3" },
              { label: l("medium", locale),        value: "0.5" },
              { label: l("heavy", locale),         value: "0.7" },
              { label: l("very_heavy", locale),    value: "0.85" },
            ],
          },
          font_style: {
            type: "select",
            label: l("font_style", locale),
            options: fontStyleOptions,
          },
          text_size: {
            type: "select",
            label: l("text_size", locale),
            options: textSizeOptions,
          },
          text_align: {
            type: "radio",
            label: l("alignment", locale),
            options: [
              { label: l("left", locale),   value: "left" },
              { label: l("center", locale), value: "center" },
              { label: l("right", locale),  value: "right" },
            ],
          },
          layout: {
            type: "radio",
            label: l("layout", locale),
            options: [
              { label: l("full_width", locale), value: "center" },
              { label: l("split", locale),      value: "split" },
            ],
          },
          show_badge: {
            type: "radio",
            label: l("show_badge", locale),
            options: [
              { label: l("yes", locale), value: "true" },
              { label: l("no", locale),  value: "false" },
            ],
          },
        },
        defaultProps: {
          headline: "",
          subtitle: "",
          cta_text: locale === "he" ? "הזמינו עכשיו" : "Book Now",
          cta_secondary_text: "",
          bg_mode: "upload",
          background_image: "",
          bg_preset_id: "photo-workspace",
          overlay_opacity: "0.5",
          font_style: "clean-sans",
          text_size: "lg",
          text_align: "right",
          layout: "center",
          show_badge: "true",
        },
        render: (props: any) => {
          const content = {
            ...props,
            overlay_opacity: parseFloat(props.overlay_opacity ?? "0.5"),
            show_badge: props.show_badge === "true",
          };
          return <HeroBlock {...content} />;
        },
      },

      About: {
        label: l("about", locale),
        fields: {
          title:       { type: "text",     label: l("title", locale) },
          description: { type: "textarea", label: l("description", locale) },
          image:       { type: "text",     label: l("image_url", locale) },
          text_align: {
            type: "radio",
            label: l("text_align", locale),
            options: [
              { label: l("left", locale),   value: "left" },
              { label: l("center", locale), value: "center" },
              { label: l("right", locale),  value: "right" },
            ],
          },
          highlight_1: { type: "text", label: `${l("highlight", locale)} 1` },
          highlight_2: { type: "text", label: `${l("highlight", locale)} 2` },
          highlight_3: { type: "text", label: `${l("highlight", locale)} 3` },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          description: "",
          image: "",
          text_align: "center",
          highlight_1: "",
          highlight_2: "",
          highlight_3: "",
          ...sectionBgDefaults,
        },
        render: (props: any) => <AboutBlock {...props} />,
      },

      Services: {
        label: l("services", locale),
        fields: {
          title:    { type: "text", label: l("title", locale) },
          subtitle: { type: "text", label: l("subtitle", locale) },
          card_layout: {
            type: "radio",
            label: l("card_layout", locale),
            options: [
              { label: l("grid", locale),    value: "grid" },
              { label: l("list", locale),    value: "list" },
              { label: l("compact", locale), value: "compact" },
            ],
          },
          show_prices: {
            type: "radio",
            label: l("show_prices", locale),
            options: [
              { label: l("yes", locale), value: "true" },
              { label: l("no", locale),  value: "false" },
            ],
          },
          show_duration: {
            type: "radio",
            label: l("show_duration", locale),
            options: [
              { label: l("yes", locale), value: "true" },
              { label: l("no", locale),  value: "false" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          subtitle: "",
          card_layout: "grid",
          show_prices: "true",
          show_duration: "true",
          ...sectionBgDefaults,
        },
        render: (props: any) => {
          const content = {
            ...props,
            show_prices: props.show_prices === "true",
            show_duration: props.show_duration === "true",
          };
          return <ServicesBlock {...content} />;
        },
      },

      Team: {
        label: l("team", locale),
        fields: {
          title:    { type: "text", label: l("title", locale) },
          subtitle: { type: "text", label: l("subtitle", locale) },
          card_style: {
            type: "radio",
            label: l("card_style", locale),
            options: [
              { label: l("photo", locale),   value: "photo" },
              { label: l("avatar", locale),  value: "avatar" },
              { label: l("minimal", locale), value: "minimal" },
            ],
          },
          show_bio: {
            type: "radio",
            label: l("show_bio", locale),
            options: [
              { label: l("yes", locale), value: "true" },
              { label: l("no", locale),  value: "false" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          subtitle: "",
          card_style: "photo",
          show_bio: "true",
          ...sectionBgDefaults,
        },
        render: (props: any) => {
          const content = { ...props, show_bio: props.show_bio === "true" };
          return <TeamBlock {...content} />;
        },
      },

      Gallery: {
        label: l("gallery", locale),
        fields: {
          title:    { type: "text", label: l("title", locale) },
          subtitle: { type: "text", label: l("subtitle", locale) },
          layout: {
            type: "radio",
            label: l("layout", locale),
            options: [
              { label: l("grid", locale),     value: "grid" },
              { label: l("masonry", locale),   value: "masonry" },
              { label: l("carousel", locale),  value: "carousel" },
            ],
          },
          columns: {
            type: "select",
            label: l("columns", locale),
            options: [
              { label: l("col2", locale), value: "2" },
              { label: l("col3", locale), value: "3" },
              { label: l("col4", locale), value: "4" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          subtitle: "",
          layout: "grid",
          columns: "3",
          images: [],
          ...sectionBgDefaults,
        },
        render: (props: any) => {
          const content = { ...props, columns: parseInt(props.columns ?? "3", 10) };
          return <GalleryBlock {...content} />;
        },
      },

      Testimonials: {
        label: l("testimonials", locale),
        fields: {
          title:    { type: "text", label: l("title", locale) },
          subtitle: { type: "text", label: l("subtitle", locale) },
          layout: {
            type: "radio",
            label: l("layout", locale),
            options: [
              { label: l("cards", locale),   value: "cards" },
              { label: l("slider", locale),  value: "slider" },
              { label: l("minimal", locale), value: "minimal" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          subtitle: "",
          layout: "cards",
          testimonials: [],
          ...sectionBgDefaults,
        },
        render: (props: any) => <TestimonialsBlock {...props} />,
      },

      CtaBanner: {
        label: l("cta_banner", locale),
        fields: {
          headline:    { type: "text",     label: l("headline", locale) },
          subtitle:    { type: "textarea", label: l("subtitle", locale) },
          button_text: { type: "text",     label: l("button_text", locale) },
          button_link: { type: "text",     label: l("button_link", locale) },
          bg_style: {
            type: "radio",
            label: l("bg_style", locale),
            options: [
              { label: l("gradient", locale), value: "gradient" },
              { label: l("solid", locale),    value: "solid" },
              { label: l("photo", locale),    value: "image" },
            ],
          },
          layout: {
            type: "radio",
            label: l("layout", locale),
            options: [
              { label: l("centered", locale),      value: "centered" },
              { label: l("left_aligned", locale),  value: "left" },
              { label: l("right_aligned", locale), value: "right" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          headline: "",
          subtitle: "",
          button_text: locale === "he" ? "הזמינו עכשיו" : "Book Now",
          button_link: "",
          bg_style: "gradient",
          bg_image: "",
          layout: "centered",
          ...sectionBgDefaults,
        },
        render: (props: any) => <CtaBannerBlock {...props} />,
      },

      Contact: {
        label: l("contact", locale),
        fields: {
          title:  { type: "text", label: l("title", locale) },
          layout: {
            type: "radio",
            label: l("layout", locale),
            options: [
              { label: l("split", locale),    value: "split" },
              { label: l("stacked", locale),  value: "stacked" },
              { label: l("with_map", locale), value: "with_map" },
            ],
          },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          layout: "split",
          ...sectionBgDefaults,
        },
        render: (props: any) => <ContactBlock {...props} />,
      },

      Products: {
        label: l("products", locale),
        fields: {
          title:    { type: "text", label: l("title", locale) },
          subtitle: { type: "text", label: l("subtitle", locale) },
          ...sectionBgFields(locale),
        },
        defaultProps: {
          title: "",
          subtitle: "",
          ...sectionBgDefaults,
        },
        render: (props: any) => <ProductsBlock {...props} />,
      },
    },
  };
}

// Kept for backward-compat; defaults to Hebrew
export const puckConfig = buildPuckConfig("he");
