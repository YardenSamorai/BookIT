export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  navStyle: "solid" | "transparent" | "glass" | "white";
  borderRadius: "sharp" | "rounded" | "pill";
  fontStyle: "modern" | "classic" | "bold" | "playful";
  cardStyle: "flat" | "shadow" | "bordered" | "glass";
  sectionStyle: "clean" | "alternating" | "spaced" | "colored";
  buttonStyle: "solid" | "outline" | "gradient";
  headingSize: "normal" | "large" | "xl";
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary with subtle shadows",
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
    primaryColor: "#1C1917",
    secondaryColor: "#A16207",
    navStyle: "transparent",
    borderRadius: "rounded",
    fontStyle: "classic",
    cardStyle: "bordered",
    sectionStyle: "spaced",
    buttonStyle: "outline",
    headingSize: "xl",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant and energetic with strong presence",
    primaryColor: "#7C3AED",
    secondaryColor: "#F59E0B",
    navStyle: "solid",
    borderRadius: "pill",
    fontStyle: "bold",
    cardStyle: "shadow",
    sectionStyle: "colored",
    buttonStyle: "gradient",
    headingSize: "xl",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with restrained elegance",
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
    primaryColor: "#78350F",
    secondaryColor: "#D97706",
    navStyle: "glass",
    borderRadius: "rounded",
    fontStyle: "classic",
    cardStyle: "shadow",
    sectionStyle: "alternating",
    buttonStyle: "solid",
    headingSize: "large",
  },
  {
    id: "fresh",
    name: "Fresh",
    description: "Light, airy, and approachable",
    primaryColor: "#065F46",
    secondaryColor: "#10B981",
    navStyle: "glass",
    borderRadius: "pill",
    fontStyle: "playful",
    cardStyle: "glass",
    sectionStyle: "spaced",
    buttonStyle: "solid",
    headingSize: "large",
  },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
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
  secondaryColor: string
): SiteTheme {
  const preset = getThemePreset(presetId);

  const radius = {
    sharp: { sm: "rounded-none", md: "rounded-none", lg: "rounded-sm", full: "rounded-sm" },
    rounded: { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" },
    pill: { sm: "rounded-full", md: "rounded-2xl", lg: "rounded-3xl", full: "rounded-full" },
  }[preset.borderRadius];

  const font = {
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
