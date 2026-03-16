import { z } from "zod";

export const sectionContentSchema = z.record(z.unknown());

export const sectionSchema = z.object({
  type: z.enum([
    "hero",
    "about",
    "services",
    "team",
    "gallery",
    "testimonials",
    "cta_banner",
    "products",
    "booking",
    "contact",
  ]),
  enabled: z.boolean(),
  order: z.number().int().min(0),
  layout: z.string(),
  content: sectionContentSchema,
});

export const updateSectionsSchema = z.array(sectionSchema);

export const updateBrandSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().optional().or(z.literal("")),
});

export const socialLinksSchema = z.object({
  instagram: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export type SectionInput = z.infer<typeof sectionSchema>;
export type UpdateSectionsInput = z.infer<typeof updateSectionsSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;
