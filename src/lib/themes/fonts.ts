export interface SiteFont {
  id: string;
  name: string;
  googleFamily: string;
  category: "sans" | "serif" | "display";
  tailwindClass: string;
  supportsHebrew: boolean;
  preview: string;
}

export const SITE_FONTS: SiteFont[] = [
  {
    id: "rubik",
    name: "Rubik",
    googleFamily: "Rubik:wght@400;500;600;700;800;900",
    category: "sans",
    tailwindClass: "font-[Rubik]",
    supportsHebrew: true,
    preview: "מודרני ונקי",
  },
  {
    id: "heebo",
    name: "Heebo",
    googleFamily: "Heebo:wght@400;500;600;700;800;900",
    category: "sans",
    tailwindClass: "font-[Heebo]",
    supportsHebrew: true,
    preview: "פשוט ואלגנטי",
  },
  {
    id: "assistant",
    name: "Assistant",
    googleFamily: "Assistant:wght@400;500;600;700;800",
    category: "sans",
    tailwindClass: "font-[Assistant]",
    supportsHebrew: true,
    preview: "קל וידידותי",
  },
  {
    id: "open-sans",
    name: "Open Sans",
    googleFamily: "Open+Sans:wght@400;500;600;700;800",
    category: "sans",
    tailwindClass: "font-['Open_Sans']",
    supportsHebrew: true,
    preview: "קלאסי ומקצועי",
  },
  {
    id: "varela-round",
    name: "Varela Round",
    googleFamily: "Varela+Round",
    category: "sans",
    tailwindClass: "font-['Varela_Round']",
    supportsHebrew: true,
    preview: "עגול ומזמין",
  },
  {
    id: "noto-sans",
    name: "Noto Sans Hebrew",
    googleFamily: "Noto+Sans+Hebrew:wght@400;500;600;700;800;900",
    category: "sans",
    tailwindClass: "font-['Noto_Sans_Hebrew']",
    supportsHebrew: true,
    preview: "אוניברסלי וברור",
  },
  {
    id: "secular-one",
    name: "Secular One",
    googleFamily: "Secular+One",
    category: "display",
    tailwindClass: "font-['Secular_One']",
    supportsHebrew: true,
    preview: "בולט ועוצמתי",
  },
  {
    id: "inter",
    name: "Inter",
    googleFamily: "Inter:wght@400;500;600;700;800;900",
    category: "sans",
    tailwindClass: "font-[Inter]",
    supportsHebrew: false,
    preview: "Clean & Modern",
  },
  {
    id: "plus-jakarta",
    name: "Plus Jakarta Sans",
    googleFamily: "Plus+Jakarta+Sans:wght@400;500;600;700;800",
    category: "sans",
    tailwindClass: "font-['Plus_Jakarta_Sans']",
    supportsHebrew: false,
    preview: "Professional & Sharp",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    googleFamily: "DM+Sans:wght@400;500;600;700",
    category: "sans",
    tailwindClass: "font-['DM_Sans']",
    supportsHebrew: false,
    preview: "Geometric & Friendly",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    googleFamily: "Playfair+Display:wght@400;500;600;700;800;900",
    category: "serif",
    tailwindClass: "font-['Playfair_Display']",
    supportsHebrew: false,
    preview: "Elegant & Luxurious",
  },
  {
    id: "frank-ruhl",
    name: "Frank Ruhl Libre",
    googleFamily: "Frank+Ruhl+Libre:wght@400;500;600;700;800;900",
    category: "serif",
    tailwindClass: "font-['Frank_Ruhl_Libre']",
    supportsHebrew: true,
    preview: "סריף אלגנטי",
  },
];

export function getSiteFont(id: string): SiteFont | undefined {
  return SITE_FONTS.find((f) => f.id === id);
}

export function getGoogleFontUrl(fontId: string): string | null {
  const font = getSiteFont(fontId);
  if (!font) return null;
  return `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
}
