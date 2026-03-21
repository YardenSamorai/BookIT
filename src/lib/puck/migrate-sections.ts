import type { Data } from "@puckeditor/core";
import type { SiteSection } from "@/lib/db/schema/site-config";

const SECTION_TYPE_TO_COMPONENT: Record<string, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  team: "Team",
  gallery: "Gallery",
  testimonials: "Testimonials",
  cta_banner: "CtaBanner",
  contact: "Contact",
  products: "Products",
};

function serializeBooleans(content: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(content)) {
    if (typeof val === "boolean") {
      result[key] = String(val);
    } else if (typeof val === "number") {
      result[key] = String(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function migrateSectionsToPuck(sections: SiteSection[]): Data {
  const enabled = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const content = enabled
    .map((section) => {
      const component = SECTION_TYPE_TO_COMPONENT[section.type];
      if (!component) return null;

      return {
        type: component,
        props: {
          id: `migrated-${section.type}-${section.order}`,
          ...serializeBooleans(section.content),
        },
      };
    })
    .filter(Boolean) as Data["content"];

  return {
    root: { props: {} },
    content,
    zones: {},
  };
}
