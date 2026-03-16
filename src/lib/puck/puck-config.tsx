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
import { usePuckBusiness } from "./puck-data-context";
import { getDir } from "@/lib/i18n";
import {
  HERO_BACKGROUNDS,
  HERO_FONT_STYLES,
  HERO_TEXT_SIZES,
} from "@/lib/themes/hero-backgrounds";

function RootRenderer({ children }: { children: ReactNode }) {
  const biz = usePuckBusiness();
  const dir = getDir(biz.locale);
  return (
    <div dir={dir} className={`min-h-full bg-white ${biz.theme.font}`}>
      {children}
    </div>
  );
}

// ── Helper: wrap content fields into the Record<string,unknown> each component expects ──

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
  return (
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
  return (
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
  return (
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
  return (
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
  return (
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
  return (
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
  return (
    <SiteContact
      business={{ name: biz.businessName, slug: biz.slug, primaryColor: biz.primaryColor, secondaryColor: biz.secondaryColor } as any}
      hours={biz.hours as any}
      content={props}
      theme={biz.theme}
      sectionIndex={props._sectionIndex ?? 7}
      locale={biz.locale}
    />
  );
}

// ── Puck Config ──

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

const fontStyleOptions = HERO_FONT_STYLES.map((f) => ({
  label: f.name,
  value: f.id,
}));

const textSizeOptions = HERO_TEXT_SIZES.map((s) => ({
  label: s.name,
  value: s.id,
}));

export const puckConfig: Config = {
  root: {
    render: ({ children }: { children: ReactNode }) => (
      <RootRenderer>{children}</RootRenderer>
    ),
  },
  categories: {
    hero: { title: "Hero", components: ["Hero"] },
    content: { title: "Content", components: ["About", "Gallery"] },
    business: { title: "Business", components: ["Services", "Team", "Contact"] },
    promotion: { title: "Promotion", components: ["CtaBanner", "Testimonials"] },
  },
  components: {
    Hero: {
      label: "Hero Banner",
      fields: {
        headline: { type: "text", label: "Headline" },
        subtitle: { type: "textarea", label: "Subtitle" },
        cta_text: { type: "text", label: "CTA Button Text" },
        cta_secondary_text: { type: "text", label: "Secondary Button Text" },
        bg_preset_id: {
          type: "select",
          label: "Background",
          options: allBgOptions,
        },
        overlay_opacity: {
          type: "select",
          label: "Overlay",
          options: [
            { label: "None", value: "0" },
            { label: "Very Light", value: "0.2" },
            { label: "Light", value: "0.3" },
            { label: "Medium", value: "0.5" },
            { label: "Heavy", value: "0.7" },
            { label: "Very Heavy", value: "0.85" },
          ],
        },
        font_style: {
          type: "select",
          label: "Font Style",
          options: fontStyleOptions,
        },
        text_size: {
          type: "select",
          label: "Text Size",
          options: textSizeOptions,
        },
        text_align: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        layout: {
          type: "radio",
          label: "Layout",
          options: [
            { label: "Full Width", value: "center" },
            { label: "Split", value: "split" },
          ],
        },
        show_badge: {
          type: "radio",
          label: "Show Badge",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
      },
      defaultProps: {
        headline: "",
        subtitle: "",
        cta_text: "Book Now",
        cta_secondary_text: "",
        bg_mode: "preset",
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
          bg_mode: "preset",
          overlay_opacity: parseFloat(props.overlay_opacity ?? "0.5"),
          show_badge: props.show_badge === "true",
        };
        return <HeroBlock {...content} />;
      },
    },

    About: {
      label: "About Section",
      fields: {
        title: { type: "text", label: "Title" },
        description: { type: "textarea", label: "Description" },
        image: { type: "text", label: "Image URL" },
        text_align: {
          type: "radio",
          label: "Text Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        highlight_1: { type: "text", label: "Highlight 1" },
        highlight_2: { type: "text", label: "Highlight 2" },
        highlight_3: { type: "text", label: "Highlight 3" },
      },
      defaultProps: {
        title: "",
        description: "",
        image: "",
        text_align: "center",
        highlight_1: "",
        highlight_2: "",
        highlight_3: "",
      },
      render: (props: any) => <AboutBlock {...props} />,
    },

    Services: {
      label: "Services",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        card_layout: {
          type: "radio",
          label: "Card Layout",
          options: [
            { label: "Grid", value: "grid" },
            { label: "List", value: "list" },
            { label: "Compact", value: "compact" },
          ],
        },
        show_prices: {
          type: "radio",
          label: "Show Prices",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
        show_duration: {
          type: "radio",
          label: "Show Duration",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
      },
      defaultProps: {
        title: "",
        subtitle: "",
        card_layout: "grid",
        show_prices: "true",
        show_duration: "true",
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
      label: "Team",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        card_style: {
          type: "radio",
          label: "Card Style",
          options: [
            { label: "Photo", value: "photo" },
            { label: "Avatar", value: "avatar" },
            { label: "Minimal", value: "minimal" },
          ],
        },
        show_bio: {
          type: "radio",
          label: "Show Bio",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
      },
      defaultProps: {
        title: "",
        subtitle: "",
        card_style: "photo",
        show_bio: "true",
      },
      render: (props: any) => {
        const content = { ...props, show_bio: props.show_bio === "true" };
        return <TeamBlock {...content} />;
      },
    },

    Gallery: {
      label: "Gallery",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        layout: {
          type: "radio",
          label: "Layout",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Masonry", value: "masonry" },
            { label: "Carousel", value: "carousel" },
          ],
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
      },
      defaultProps: {
        title: "",
        subtitle: "",
        layout: "grid",
        columns: "3",
        images: [],
      },
      render: (props: any) => {
        const content = { ...props, columns: parseInt(props.columns ?? "3", 10) };
        return <GalleryBlock {...content} />;
      },
    },

    Testimonials: {
      label: "Testimonials",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        layout: {
          type: "radio",
          label: "Layout",
          options: [
            { label: "Cards", value: "cards" },
            { label: "Slider", value: "slider" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        title: "",
        subtitle: "",
        layout: "cards",
        testimonials: [],
      },
      render: (props: any) => <TestimonialsBlock {...props} />,
    },

    CtaBanner: {
      label: "CTA Banner",
      fields: {
        headline: { type: "text", label: "Headline" },
        subtitle: { type: "textarea", label: "Subtitle" },
        button_text: { type: "text", label: "Button Text" },
        button_link: { type: "text", label: "Button Link" },
        bg_style: {
          type: "radio",
          label: "Background Style",
          options: [
            { label: "Gradient", value: "gradient" },
            { label: "Solid", value: "solid" },
            { label: "Image", value: "image" },
          ],
        },
        layout: {
          type: "radio",
          label: "Layout",
          options: [
            { label: "Centered", value: "centered" },
            { label: "Left Aligned", value: "left" },
            { label: "Right Aligned", value: "right" },
          ],
        },
      },
      defaultProps: {
        headline: "",
        subtitle: "",
        button_text: "Book Now",
        button_link: "",
        bg_style: "gradient",
        bg_image: "",
        layout: "centered",
      },
      render: (props: any) => <CtaBannerBlock {...props} />,
    },

    Contact: {
      label: "Contact",
      fields: {
        title: { type: "text", label: "Title" },
        map_embed_url: { type: "textarea", label: "Google Maps Embed URL" },
        layout: {
          type: "radio",
          label: "Layout",
          options: [
            { label: "Split", value: "split" },
            { label: "Stacked", value: "stacked" },
            { label: "With Map", value: "with_map" },
          ],
        },
      },
      defaultProps: {
        title: "",
        map_embed_url: "",
        layout: "split",
      },
      render: (props: any) => <ContactBlock {...props} />,
    },
  },
};
