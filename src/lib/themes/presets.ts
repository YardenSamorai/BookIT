export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  nameKey: string;
  descriptionKey: string;
  primaryColor: string;
  secondaryColor: string;
  navStyle: "solid" | "transparent" | "glass" | "white";
  borderRadius: "sharp" | "rounded" | "pill";
  fontStyle: "modern" | "classic" | "bold" | "playful";
  cardStyle: "flat" | "shadow" | "bordered" | "glass";
  sectionStyle: "clean" | "alternating" | "spaced" | "colored";
  buttonStyle: "solid" | "outline" | "gradient";
  headingSize: "normal" | "large" | "xl";
  premium?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary with subtle shadows",
    nameKey: "theme.modern",
    descriptionKey: "theme.modern_desc",
    primaryColor: "#0F172A",
    secondaryColor: "#3B82F6",
    navStyle: "solid",
    borderRadius: "rounded",
    fontStyle: "modern",
    cardStyle: "shadow",
    sectionStyle: "clean",
    buttonStyle: "solid",
    headingSize: "large",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined and luxurious with serif accents",
    nameKey: "theme.elegant",
    descriptionKey: "theme.elegant_desc",
    primaryColor: "#1C1917",
    secondaryColor: "#A16207",
    navStyle: "transparent",
    borderRadius: "rounded",
    fontStyle: "classic",
    cardStyle: "bordered",
    sectionStyle: "spaced",
    buttonStyle: "outline",
    headingSize: "xl",
    premium: true,
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant and energetic with strong presence",
    nameKey: "theme.bold",
    descriptionKey: "theme.bold_desc",
    primaryColor: "#7C3AED",
    secondaryColor: "#F59E0B",
    navStyle: "solid",
    borderRadius: "pill",
    fontStyle: "bold",
    cardStyle: "shadow",
    sectionStyle: "colored",
    buttonStyle: "gradient",
    headingSize: "xl",
    premium: true,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with restrained elegance",
    nameKey: "theme.minimal",
    descriptionKey: "theme.minimal_desc",
    primaryColor: "#18181B",
    secondaryColor: "#18181B",
    navStyle: "white",
    borderRadius: "sharp",
    fontStyle: "modern",
    cardStyle: "flat",
    sectionStyle: "clean",
    buttonStyle: "outline",
    headingSize: "normal",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Inviting and cozy with earthy tones",
    nameKey: "theme.warm",
    descriptionKey: "theme.warm_desc",
    primaryColor: "#78350F",
    secondaryColor: "#D97706",
    navStyle: "glass",
    borderRadius: "rounded",
    fontStyle: "classic",
    cardStyle: "shadow",
    sectionStyle: "alternating",
    buttonStyle: "solid",
    headingSize: "large",
    premium: true,
  },
  {
    id: "fresh",
    name: "Fresh",
    description: "Light, airy, and approachable",
    nameKey: "theme.fresh",
    descriptionKey: "theme.fresh_desc",
    primaryColor: "#065F46",
    secondaryColor: "#10B981",
    navStyle: "glass",
    borderRadius: "pill",
    fontStyle: "playful",
    cardStyle: "glass",
    sectionStyle: "spaced",
    buttonStyle: "solid",
    headingSize: "large",
    premium: true,
  },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export interface ColorPalette {
  id: string;
  name: { he: string; en: string };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    heading: string;
  };
  preview: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "ocean-breeze",
    name: { he: "משב אוקיינוס", en: "Ocean Breeze" },
    colors: { primary: "#0077b6", secondary: "#00b4d8", accent: "#90e0ef", background: "#f0f9ff", surface: "#ffffff", text: "#1e293b", textMuted: "#64748b", heading: "#023e8a" },
    preview: ["#0077b6", "#00b4d8", "#90e0ef", "#f0f9ff"],
  },
  {
    id: "sunset-glow",
    name: { he: "זוהר שקיעה", en: "Sunset Glow" },
    colors: { primary: "#e63946", secondary: "#f77f00", accent: "#fcbf49", background: "#fff8f0", surface: "#ffffff", text: "#1d1d1d", textMuted: "#6b6b6b", heading: "#c1121f" },
    preview: ["#e63946", "#f77f00", "#fcbf49", "#fff8f0"],
  },
  {
    id: "forest-haven",
    name: { he: "מקלט יער", en: "Forest Haven" },
    colors: { primary: "#2d6a4f", secondary: "#40916c", accent: "#95d5b2", background: "#f0fdf4", surface: "#ffffff", text: "#1b4332", textMuted: "#52796f", heading: "#1b4332" },
    preview: ["#2d6a4f", "#40916c", "#95d5b2", "#f0fdf4"],
  },
  {
    id: "royal-elegance",
    name: { he: "הדר מלכותי", en: "Royal Elegance" },
    colors: { primary: "#5b21b6", secondary: "#7c3aed", accent: "#c4b5fd", background: "#faf5ff", surface: "#ffffff", text: "#1e1b4b", textMuted: "#6b7280", heading: "#3b0764" },
    preview: ["#5b21b6", "#7c3aed", "#c4b5fd", "#faf5ff"],
  },
  {
    id: "rose-garden",
    name: { he: "גן ורדים", en: "Rose Garden" },
    colors: { primary: "#be185d", secondary: "#ec4899", accent: "#fbcfe8", background: "#fdf2f8", surface: "#ffffff", text: "#1f1f1f", textMuted: "#6b6b6b", heading: "#9d174d" },
    preview: ["#be185d", "#ec4899", "#fbcfe8", "#fdf2f8"],
  },
  {
    id: "midnight-luxe",
    name: { he: "לילה מפואר", en: "Midnight Luxe" },
    colors: { primary: "#c9a227", secondary: "#d4af37", accent: "#f0d060", background: "#0f172a", surface: "#1e293b", text: "#f1f5f9", textMuted: "#94a3b8", heading: "#fbbf24" },
    preview: ["#c9a227", "#0f172a", "#1e293b", "#f1f5f9"],
  },
  {
    id: "cherry-blossom",
    name: { he: "פריחת דובדבן", en: "Cherry Blossom" },
    colors: { primary: "#db2777", secondary: "#f472b6", accent: "#fce7f3", background: "#fff1f2", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", heading: "#9f1239" },
    preview: ["#db2777", "#f472b6", "#fce7f3", "#fff1f2"],
  },
  {
    id: "arctic-frost",
    name: { he: "קרח ארקטי", en: "Arctic Frost" },
    colors: { primary: "#0284c7", secondary: "#38bdf8", accent: "#bae6fd", background: "#f0f9ff", surface: "#ffffff", text: "#0c4a6e", textMuted: "#64748b", heading: "#075985" },
    preview: ["#0284c7", "#38bdf8", "#bae6fd", "#f0f9ff"],
  },
  {
    id: "earthy-warmth",
    name: { he: "חום אדמתי", en: "Earthy Warmth" },
    colors: { primary: "#92400e", secondary: "#b45309", accent: "#fcd34d", background: "#fffbeb", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", heading: "#78350f" },
    preview: ["#92400e", "#b45309", "#fcd34d", "#fffbeb"],
  },
  {
    id: "neon-energy",
    name: { he: "אנרגיית ניאון", en: "Neon Energy" },
    colors: { primary: "#7c3aed", secondary: "#06b6d4", accent: "#a78bfa", background: "#0f0f23", surface: "#1a1a2e", text: "#e2e8f0", textMuted: "#94a3b8", heading: "#818cf8" },
    preview: ["#7c3aed", "#06b6d4", "#0f0f23", "#e2e8f0"],
  },
  {
    id: "terracotta",
    name: { he: "טרקוטה", en: "Terracotta" },
    colors: { primary: "#c2410c", secondary: "#ea580c", accent: "#fed7aa", background: "#fff7ed", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", heading: "#9a3412" },
    preview: ["#c2410c", "#ea580c", "#fed7aa", "#fff7ed"],
  },
  {
    id: "sage-serenity",
    name: { he: "מרווה שלווה", en: "Sage Serenity" },
    colors: { primary: "#4d7c0f", secondary: "#65a30d", accent: "#d9f99d", background: "#f7fee7", surface: "#ffffff", text: "#1a2e05", textMuted: "#6b7280", heading: "#365314" },
    preview: ["#4d7c0f", "#65a30d", "#d9f99d", "#f7fee7"],
  },
  {
    id: "steel-modern",
    name: { he: "פלדה מודרני", en: "Steel Modern" },
    colors: { primary: "#334155", secondary: "#475569", accent: "#94a3b8", background: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#64748b", heading: "#1e293b" },
    preview: ["#334155", "#475569", "#94a3b8", "#f8fafc"],
  },
  {
    id: "coral-reef",
    name: { he: "שונית אלמוגים", en: "Coral Reef" },
    colors: { primary: "#f43f5e", secondary: "#fb7185", accent: "#fecdd3", background: "#fff1f2", surface: "#ffffff", text: "#1f1f1f", textMuted: "#737373", heading: "#e11d48" },
    preview: ["#f43f5e", "#fb7185", "#fecdd3", "#fff1f2"],
  },
  {
    id: "teal-paradise",
    name: { he: "גן עדן טורקיז", en: "Teal Paradise" },
    colors: { primary: "#0d9488", secondary: "#14b8a6", accent: "#99f6e4", background: "#f0fdfa", surface: "#ffffff", text: "#134e4a", textMuted: "#5eead4", heading: "#115e59" },
    preview: ["#0d9488", "#14b8a6", "#99f6e4", "#f0fdfa"],
  },
  {
    id: "dark-mocha",
    name: { he: "מוקה כהה", en: "Dark Mocha" },
    colors: { primary: "#d97706", secondary: "#f59e0b", accent: "#fcd34d", background: "#1c1917", surface: "#292524", text: "#fafaf9", textMuted: "#a8a29e", heading: "#fbbf24" },
    preview: ["#d97706", "#1c1917", "#292524", "#fafaf9"],
  },
  {
    id: "golden-hour",
    name: { he: "שעת הזהב", en: "Golden Hour" },
    colors: { primary: "#b45309", secondary: "#d97706", accent: "#fde68a", background: "#fffbeb", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", heading: "#92400e" },
    preview: ["#b45309", "#d97706", "#fde68a", "#fffbeb"],
  },
  {
    id: "nordic-cool",
    name: { he: "צפון קריר", en: "Nordic Cool" },
    colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#bfdbfe", background: "#eff6ff", surface: "#ffffff", text: "#1e3a5f", textMuted: "#64748b", heading: "#1e3a8a" },
    preview: ["#1e40af", "#3b82f6", "#bfdbfe", "#eff6ff"],
  },
  {
    id: "tropical-sunset",
    name: { he: "שקיעה טרופית", en: "Tropical Sunset" },
    colors: { primary: "#dc2626", secondary: "#f97316", accent: "#fbbf24", background: "#fffbeb", surface: "#ffffff", text: "#1f2937", textMuted: "#6b7280", heading: "#b91c1c" },
    preview: ["#dc2626", "#f97316", "#fbbf24", "#fffbeb"],
  },
  {
    id: "pastel-dream",
    name: { he: "חלום פסטל", en: "Pastel Dream" },
    colors: { primary: "#8b5cf6", secondary: "#ec4899", accent: "#fbcfe8", background: "#fdf4ff", surface: "#ffffff", text: "#374151", textMuted: "#9ca3af", heading: "#6d28d9" },
    preview: ["#8b5cf6", "#ec4899", "#fbcfe8", "#fdf4ff"],
  },
];

export function getColorPalette(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find((p) => p.id === id);
}

export interface SiteTheme {
  preset: ThemePreset;
  primaryColor: string;
  secondaryColor: string;

  radius: { sm: string; md: string; lg: string; full: string };
  font: string;
  headingWeight: string;
  headingSize: {
    section: string;
    hero: string;
  };
  card: string;
  cardHover: string;
  buttonClasses: string;
  sectionBgEven: string;
  sectionBgOdd: string;
  navClasses: string;
  badge: string;
  sectionSpacing: string;
  imageRadius: string;
  divider: string;
}

export function buildSiteTheme(
  presetId: string,
  primaryColor: string,
  secondaryColor: string,
  fontFamily?: string | null
): SiteTheme {
  const preset = getThemePreset(presetId);

  const radius = {
    sharp: { sm: "rounded-none", md: "rounded-none", lg: "rounded-sm", full: "rounded-sm" },
    rounded: { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" },
    pill: { sm: "rounded-full", md: "rounded-2xl", lg: "rounded-3xl", full: "rounded-full" },
  }[preset.borderRadius];

  const font = fontFamily
    ? fontFamily
    : {
        modern: "font-sans",
        classic: "font-serif",
        bold: "font-sans",
        playful: "font-sans",
      }[preset.fontStyle];

  const headingWeight = {
    modern: "font-extrabold",
    classic: "font-bold",
    bold: "font-black",
    playful: "font-extrabold",
  }[preset.fontStyle];

  const headingSize = {
    normal: {
      section: "text-2xl sm:text-3xl",
      hero: "text-3xl sm:text-5xl lg:text-6xl",
    },
    large: {
      section: "text-3xl sm:text-4xl",
      hero: "text-4xl sm:text-5xl lg:text-7xl",
    },
    xl: {
      section: "text-3xl sm:text-4xl lg:text-5xl",
      hero: "text-4xl sm:text-6xl lg:text-8xl",
    },
  }[preset.headingSize];

  const card = {
    flat: "border-0 bg-gray-50/80",
    shadow: "border border-gray-100 bg-white shadow-sm",
    bordered: "border-2 border-gray-200 bg-white",
    glass: "border border-white/20 bg-white/80 backdrop-blur-sm shadow-sm",
  }[preset.cardStyle];

  const cardHover = {
    flat: "hover:bg-gray-100/80",
    shadow: "hover:shadow-lg hover:-translate-y-0.5",
    bordered: "hover:border-gray-400",
    glass: "hover:bg-white/90 hover:shadow-md",
  }[preset.cardStyle];

  const buttonClasses = {
    solid: `${radius.sm} font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110`,
    outline: `${radius.sm} font-semibold border-2 transition-all hover:shadow-md`,
    gradient: `${radius.full} font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105`,
  }[preset.buttonStyle];

  const sectionBgs = {
    alternating: { even: "bg-white", odd: "bg-gray-50/80" },
    spaced: { even: "bg-white", odd: "bg-white" },
    colored: { even: "bg-white", odd: "bg-gray-50/60" },
    clean: { even: "bg-white", odd: "bg-gray-50/50" },
  }[preset.sectionStyle] ?? { even: "bg-white", odd: "bg-gray-50/50" };

  const navClasses = {
    solid: "border-b border-white/10 backdrop-blur-md",
    transparent: "bg-transparent absolute left-0 right-0 top-0",
    glass: "border-b border-white/10 backdrop-blur-xl bg-opacity-60",
    white: "border-b border-gray-100 bg-white",
  }[preset.navStyle];

  const badge = `${radius.full} text-xs font-medium`;

  const sectionSpacing = {
    clean: "py-16 sm:py-20",
    alternating: "py-16 sm:py-24",
    spaced: "py-20 sm:py-28",
    colored: "py-16 sm:py-20",
  }[preset.sectionStyle];

  const imageRadius = {
    sharp: "rounded-sm",
    rounded: "rounded-xl",
    pill: "rounded-2xl",
  }[preset.borderRadius];

  const divider = preset.sectionStyle === "spaced"
    ? "border-t border-gray-100 mx-auto max-w-5xl"
    : "";

  return {
    preset,
    primaryColor,
    secondaryColor,
    radius,
    font,
    headingWeight,
    headingSize,
    card,
    cardHover,
    buttonClasses,
    sectionBgEven: sectionBgs.even,
    sectionBgOdd: sectionBgs.odd,
    navClasses,
    badge,
    sectionSpacing,
    imageRadius,
    divider,
  };
}
