export interface HeroBackground {
  id: string;
  name: string;
  category: "dark" | "light" | "colorful" | "texture" | "photo";
  subcategory?: "nature" | "urban" | "workspace" | "abstract" | "lifestyle";
  textColor: "white" | "dark";
  preview: string;
  type: "css" | "image";
  css?: React.CSSProperties;
  imageUrl?: string;
}

function picsum(photoId: number, w: number, h: number) {
  return `https://picsum.photos/id/${photoId}/${w}/${h}`;
}

function photo(
  id: string,
  name: string,
  picsumId: number,
  subcategory: HeroBackground["subcategory"],
): HeroBackground {
  return {
    id,
    name,
    category: "photo",
    subcategory,
    textColor: "white",
    type: "image",
    imageUrl: picsum(picsumId, 1920, 1080),
    preview: picsum(picsumId, 400, 225),
  };
}

// ────────────────────────────────────────────
// Photo Backgrounds – organized by subcategory
// ────────────────────────────────────────────

const NATURE_PHOTOS: HeroBackground[] = [
  photo("photo-nature-path", "Forest Path", 15, "nature"),
  photo("photo-mountain", "Snow Peak", 36, "nature"),
  photo("photo-green", "Lush Green", 119, "nature"),
  photo("photo-ocean", "Ocean View", 141, "nature"),
  photo("photo-mountain-lake", "Mountain Lake", 1015, "nature"),
  photo("photo-trail", "Mountain Trail", 1018, "nature"),
  photo("photo-dark-nature", "Dark Forest", 1067, "nature"),
  photo("photo-beach-sunset", "Beach Sunset", 164, "nature"),
  photo("photo-palm-trees", "Palm Trees", 169, "nature"),
  photo("photo-foggy-forest", "Foggy Forest", 329, "nature"),
  photo("photo-lavender", "Lavender Field", 299, "nature"),
  photo("photo-canyon", "Red Canyon", 403, "nature"),
  photo("photo-lake-reflection", "Lake Reflection", 240, "nature"),
  photo("photo-green-valley", "Green Valley", 416, "nature"),
  photo("photo-blue-sky", "Open Sky", 434, "nature"),
  photo("photo-autumn", "Autumn Colors", 244, "nature"),
  photo("photo-rocks", "Coastal Rocks", 336, "nature"),
  photo("photo-sunset", "Golden Sunset", 129, "nature"),
  photo("photo-n-forest", "Sunlit Forest", 10, "nature"),
  photo("photo-n-dark-forest", "Dark Canopy", 11, "nature"),
  photo("photo-n-shoreline", "Rocky Shore", 12, "nature"),
  photo("photo-n-lake", "Alpine Lake", 16, "nature"),
  photo("photo-n-pier", "Lake Pier", 17, "nature"),
  photo("photo-n-river", "River Flow", 14, "nature"),
  photo("photo-n-cliff", "Cliff Edge", 22, "nature"),
  photo("photo-n-panorama", "Wide Panorama", 27, "nature"),
  photo("photo-n-waves", "Ocean Waves", 28, "nature"),
  photo("photo-n-meadow", "Mountain Meadow", 29, "nature"),
  photo("photo-n-autumn", "Fall Leaves", 39, "nature"),
  photo("photo-n-lake2", "Still Lake", 55, "nature"),
  photo("photo-n-summit", "Mountain Summit", 73, "nature"),
  photo("photo-n-desert", "Desert Canyon", 91, "nature"),
];

const URBAN_PHOTOS: HeroBackground[] = [
  photo("photo-city", "City Lights", 180, "urban"),
  photo("photo-town", "Charming Town", 160, "urban"),
  photo("photo-architecture", "Architecture", 122, "urban"),
  photo("photo-bridge", "Golden Gate", 1035, "urban"),
  photo("photo-skyline", "City Skyline", 1043, "urban"),
  photo("photo-night-city", "Night City", 292, "urban"),
  photo("photo-rainy-street", "Rainy Street", 318, "urban"),
  photo("photo-tunnel", "Light Tunnel", 477, "urban"),
  photo("photo-modern-building", "Modern Building", 274, "urban"),
  photo("photo-u-rooftop", "Urban View", 20, "urban"),
  photo("photo-u-alley", "City Alley", 21, "urban"),
  photo("photo-u-old-city", "Old Town", 43, "urban"),
  photo("photo-u-facade", "Glass Facade", 44, "urban"),
  photo("photo-u-bridge", "Urban Bridge", 63, "urban"),
  photo("photo-u-night", "Night Lights", 83, "urban"),
  photo("photo-u-skyline2", "Distant Skyline", 84, "urban"),
  photo("photo-u-downtown", "Downtown", 93, "urban"),
  photo("photo-u-overpass", "Overpass", 99, "urban"),
];

const WORKSPACE_PHOTOS: HeroBackground[] = [
  photo("photo-workspace", "Modern Workspace", 0, "workspace"),
  photo("photo-desk", "Minimal Desk", 60, "workspace"),
  photo("photo-laptop", "Tech Setup", 48, "workspace"),
  photo("photo-creative", "Creative Studio", 193, "workspace"),
  photo("photo-coffee", "Coffee & Warmth", 96, "workspace"),
  photo("photo-books", "Library", 1073, "workspace"),
  photo("photo-w-coding", "Coding", 1, "workspace"),
  photo("photo-w-notebook", "Notebook", 2, "workspace"),
  photo("photo-w-office", "Office View", 7, "workspace"),
  photo("photo-w-mobile", "Mobile Work", 8, "workspace"),
  photo("photo-w-keyboard", "Keyboard", 26, "workspace"),
  photo("photo-w-monitor", "Monitor Setup", 42, "workspace"),
  photo("photo-w-camera", "Camera Gear", 90, "workspace"),
  photo("photo-w-retro", "Vintage Tech", 72, "workspace"),
];

const ABSTRACT_PHOTOS: HeroBackground[] = [
  photo("photo-stone", "Stone Texture", 1029, "abstract"),
  photo("photo-petals", "Flower Petals", 1076, "abstract"),
  photo("photo-wood", "Wood Texture", 355, "abstract"),
  photo("photo-abstract-light", "Abstract Light", 287, "abstract"),
  photo("photo-dark-abstract", "Dark Abstract", 351, "abstract"),
  photo("photo-flowers", "Flowers & Beauty", 80, "abstract"),
  photo("photo-a-rope", "Rope Coil", 6, "abstract"),
  photo("photo-a-pattern", "Abstract Pattern", 9, "abstract"),
  photo("photo-a-bokeh", "Bokeh Lights", 24, "abstract"),
  photo("photo-a-plant", "Green Plant", 30, "abstract"),
  photo("photo-a-wire", "Wire Art", 34, "abstract"),
  photo("photo-a-leaf", "Single Leaf", 56, "abstract"),
  photo("photo-a-paint", "Paint Splash", 59, "abstract"),
  photo("photo-a-surface", "Textured Surface", 53, "abstract"),
  photo("photo-a-glass", "Glass Refraction", 98, "abstract"),
  photo("photo-a-crystal", "Crystal Light", 95, "abstract"),
];

const LIFESTYLE_PHOTOS: HeroBackground[] = [
  photo("photo-l-cafe", "Café Scene", 13, "lifestyle"),
  photo("photo-l-harbor", "Harbor View", 19, "lifestyle"),
  photo("photo-l-dog", "Loyal Friend", 25, "lifestyle"),
  photo("photo-l-concert", "Live Music", 37, "lifestyle"),
  photo("photo-l-dining", "Fine Dining", 38, "lifestyle"),
  photo("photo-l-travel", "Travel Scene", 57, "lifestyle"),
  photo("photo-l-market", "Market Day", 58, "lifestyle"),
  photo("photo-l-vintage", "Vintage Moment", 52, "lifestyle"),
  photo("photo-l-picnic", "Garden Party", 82, "lifestyle"),
  photo("photo-l-road", "Open Road", 69, "lifestyle"),
  photo("photo-l-wildlife", "Wildlife", 40, "lifestyle"),
  photo("photo-l-balloons", "Balloons", 70, "lifestyle"),
  photo("photo-l-sport", "Active Life", 64, "lifestyle"),
  photo("photo-l-artisan", "Artisan Work", 100, "lifestyle"),
];

// ────────────────────────────────────────────
// CSS Backgrounds (unchanged)
// ────────────────────────────────────────────

const DARK_CSS: HeroBackground[] = [
  {
    id: "dark-stone",
    name: "Dark Stone",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
    css: {
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(160deg, #0d0d0d, #1a1a1a, #2d2d2d)",
    css: {
      background:
        "radial-gradient(ellipse at 20% 50%, #1a1a2e 0%, transparent 50%), " +
        "radial-gradient(ellipse at 80% 20%, #2d1b4e 0%, transparent 40%), " +
        "linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(180deg, #2c3e50, #1a252f)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, #34495e 0%, transparent 60%), " +
        "linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0c0c1d, #1a1a3e, #0c0c1d)",
    css: {
      background:
        "radial-gradient(ellipse at 30% 0%, #1e3a5f 0%, transparent 50%), " +
        "radial-gradient(ellipse at 70% 100%, #1a1a3e 0%, transparent 50%), " +
        "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #0c0c1d 100%)",
    },
  },
  {
    id: "volcanic",
    name: "Volcanic",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1a0a0a, #2d1212, #1a0a0a)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 50%, #3d1515 0%, transparent 60%), " +
        "radial-gradient(ellipse at 20% 80%, #2d0a0a 0%, transparent 40%), " +
        "linear-gradient(135deg, #1a0a0a 0%, #2d1212 50%, #1a0a0a 100%)",
    },
  },
  {
    id: "dark-emerald",
    name: "Dark Emerald",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0a1a0a, #0d2818, #0a1a0a)",
    css: {
      background:
        "radial-gradient(ellipse at 40% 30%, #0d3320 0%, transparent 50%), " +
        "radial-gradient(ellipse at 70% 70%, #0a2415 0%, transparent 40%), " +
        "linear-gradient(135deg, #0a1a0a 0%, #0d2818 50%, #0a1a0a 100%)",
    },
  },
  {
    id: "dark-navy",
    name: "Deep Navy",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0a0e27, #141b3d, #0a0e27)",
    css: {
      background:
        "radial-gradient(ellipse at 60% 0%, #1e3a5f 0%, transparent 45%), " +
        "linear-gradient(135deg, #0a0e27 0%, #141b3d 50%, #0a0e27 100%)",
    },
  },
  {
    id: "dark-purple",
    name: "Dark Purple",
    category: "dark",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1a0a2e, #2d1552, #1a0a2e)",
    css: {
      background:
        "radial-gradient(ellipse at 30% 20%, #4c1d95 0%, transparent 50%), " +
        "radial-gradient(ellipse at 70% 80%, #2e1065 0%, transparent 40%), " +
        "linear-gradient(135deg, #1a0a2e 0%, #2d1552 50%, #1a0a2e 100%)",
    },
  },
];

const TEXTURE_CSS: HeroBackground[] = [
  {
    id: "brushed-metal",
    name: "Brushed Metal",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #2c3e50, #4a6741, #2c3e50)",
    css: {
      background:
        "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px), " +
        "linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)",
    },
  },
  {
    id: "concrete",
    name: "Concrete",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(180deg, #3a3a3a, #2a2a2a, #3a3a3a)",
    css: {
      background:
        "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 0%, transparent 50%), " +
        "radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 0%, transparent 50%), " +
        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%), " +
        "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 50%, #3a3a3a 100%)",
    },
  },
  {
    id: "marble-dark",
    name: "Dark Marble",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1a1a1a, #2d2d35, #1a1a1a)",
    css: {
      background:
        "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 40%), " +
        "radial-gradient(ellipse at 80% 60%, rgba(200,200,220,0.04) 0%, transparent 35%), " +
        "radial-gradient(ellipse at 40% 80%, rgba(255,255,255,0.03) 0%, transparent 45%), " +
        "linear-gradient(135deg, #1a1a1a 0%, #2d2d35 40%, #1a1a1a 100%)",
    },
  },
  {
    id: "leather",
    name: "Leather",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #2a1f14, #3d2b1a, #2a1f14)",
    css: {
      background:
        "radial-gradient(circle at 30% 40%, rgba(255,200,150,0.05) 0%, transparent 40%), " +
        "radial-gradient(circle at 70% 60%, rgba(0,0,0,0.15) 0%, transparent 40%), " +
        "linear-gradient(135deg, #2a1f14 0%, #3d2b1a 50%, #2a1f14 100%)",
    },
  },
  {
    id: "linen",
    name: "Linen",
    category: "texture",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(135deg, #f5f0e8, #ede5d8, #f5f0e8)",
    css: {
      background:
        "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.015) 1px, rgba(0,0,0,0.015) 2px), " +
        "linear-gradient(135deg, #f5f0e8 0%, #ede5d8 50%, #f5f0e8 100%)",
    },
  },
  {
    id: "dark-wood",
    name: "Dark Wood",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1c1410, #2a1e16, #1c1410)",
    css: {
      background:
        "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 6px), " +
        "radial-gradient(ellipse at 40% 40%, rgba(139,90,43,0.15) 0%, transparent 50%), " +
        "linear-gradient(135deg, #1c1410 0%, #2a1e16 50%, #1c1410 100%)",
    },
  },
  {
    id: "slate-texture",
    name: "Slate",
    category: "texture",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #1e293b, #334155, #1e293b)",
    css: {
      background:
        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.04) 0%, transparent 30%), " +
        "radial-gradient(circle at 80% 70%, rgba(255,255,255,0.03) 0%, transparent 30%), " +
        "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
    },
  },
];

const COLORFUL_CSS: HeroBackground[] = [
  {
    id: "sunset",
    name: "Sunset",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #f093fb, #f5576c, #fda085)",
    css: {
      background: "linear-gradient(135deg, #667eea 0%, #f093fb 30%, #f5576c 60%, #fda085 100%)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0c3483, #1565c0, #00897b)",
    css: {
      background:
        "radial-gradient(ellipse at 30% 20%, #1565c0 0%, transparent 50%), " +
        "linear-gradient(135deg, #0c3483 0%, #0d47a1 30%, #006064 100%)",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    css: {
      background:
        "radial-gradient(ellipse at 20% 0%, #7c3aed 0%, transparent 50%), " +
        "radial-gradient(ellipse at 80% 100%, #06b6d4 0%, transparent 50%), " +
        "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #3d2226, #6b3a3a, #3d2226)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, #b76e79 0%, transparent 50%), " +
        "linear-gradient(135deg, #3d2226 0%, #6b3a3a 50%, #3d2226 100%)",
    },
  },
  {
    id: "emerald-glow",
    name: "Emerald Glow",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0a2f1f, #145a38, #0a2f1f)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 30%, #10b981 0%, transparent 50%), " +
        "linear-gradient(135deg, #0a2f1f 0%, #145a38 50%, #064e3b 100%)",
    },
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #0c1445, #1e40af, #3b82f6)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, #3b82f6 0%, transparent 50%), " +
        "radial-gradient(ellipse at 80% 80%, #1e40af 0%, transparent 40%), " +
        "linear-gradient(135deg, #0c1445 0%, #1e40af 50%, #0f172a 100%)",
    },
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #7c2d12, #c2410c, #f59e0b)",
    css: {
      background:
        "radial-gradient(ellipse at 20% 80%, #c2410c 0%, transparent 50%), " +
        "linear-gradient(135deg, #7c2d12 0%, #b45309 50%, #92400e 100%)",
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, #a78bfa 0%, transparent 40%), " +
        "radial-gradient(ellipse at 30% 80%, #7c3aed 0%, transparent 50%), " +
        "linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #3b0764 100%)",
    },
  },
  {
    id: "teal-gradient",
    name: "Teal Dream",
    category: "colorful",
    textColor: "white",
    type: "css",
    preview: "linear-gradient(135deg, #042f2e, #0f766e, #14b8a6)",
    css: {
      background:
        "radial-gradient(ellipse at 60% 20%, #14b8a6 0%, transparent 45%), " +
        "linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #134e4a 100%)",
    },
  },
];

const LIGHT_CSS: HeroBackground[] = [
  {
    id: "marble-light",
    name: "Light Marble",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(135deg, #f5f5f0, #e8e4de, #f5f5f0)",
    css: {
      background:
        "radial-gradient(ellipse at 20% 30%, rgba(200,190,180,0.3) 0%, transparent 50%), " +
        "radial-gradient(ellipse at 80% 70%, rgba(180,175,170,0.2) 0%, transparent 40%), " +
        "radial-gradient(ellipse at 50% 50%, rgba(220,215,210,0.15) 0%, transparent 60%), " +
        "linear-gradient(135deg, #f5f5f0 0%, #e8e4de 40%, #f5f5f0 100%)",
    },
  },
  {
    id: "clean-white",
    name: "Clean White",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #ffffff, #f8f9fa)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.05) 0%, transparent 50%), " +
        "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
    },
  },
  {
    id: "warm-cream",
    name: "Warm Cream",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #faf8f5, #f0ece4)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(217,119,6,0.06) 0%, transparent 50%), " +
        "linear-gradient(180deg, #faf8f5 0%, #f0ece4 100%)",
    },
  },
  {
    id: "soft-gray",
    name: "Soft Gray",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #f1f5f9, #e2e8f0)",
    css: {
      background:
        "radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.05) 0%, transparent 50%), " +
        "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
    },
  },
  {
    id: "blush-pink",
    name: "Blush Pink",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #fdf2f8, #fce7f3)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.06) 0%, transparent 50%), " +
        "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)",
    },
  },
  {
    id: "mint-green",
    name: "Mint Green",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #f0fdf4, #dcfce7)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 50%), " +
        "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
    },
  },
  {
    id: "sky-blue",
    name: "Sky Blue",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #f0f9ff, #e0f2fe)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, transparent 50%), " +
        "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)",
    },
  },
  {
    id: "lavender-light",
    name: "Lavender",
    category: "light",
    textColor: "dark",
    type: "css",
    preview: "linear-gradient(180deg, #faf5ff, #f3e8ff)",
    css: {
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 50%), " +
        "linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)",
    },
  },
];

// ────────────────────────────────────────────
// Combined export
// ────────────────────────────────────────────

export const HERO_BACKGROUNDS: HeroBackground[] = [
  ...NATURE_PHOTOS,
  ...URBAN_PHOTOS,
  ...WORKSPACE_PHOTOS,
  ...ABSTRACT_PHOTOS,
  ...LIFESTYLE_PHOTOS,
  ...DARK_CSS,
  ...TEXTURE_CSS,
  ...COLORFUL_CSS,
  ...LIGHT_CSS,
];

export function getHeroBackground(id: string): HeroBackground | undefined {
  return HERO_BACKGROUNDS.find((bg) => bg.id === id);
}

export const BACKGROUND_CATEGORIES = [
  { id: "photo", label: "Photos" },
  { id: "dark", label: "Dark" },
  { id: "texture", label: "Textures" },
  { id: "colorful", label: "Colorful" },
  { id: "light", label: "Light" },
] as const;

export const PHOTO_SUBCATEGORIES = [
  { id: "all", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "urban", label: "Urban" },
  { id: "workspace", label: "Workspace" },
  { id: "abstract", label: "Abstract" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

export const PHOTOS_PER_PAGE = 12;

// ── Hero Text Customization Options ──

export const HERO_FONT_STYLES = [
  {
    id: "modern-bold",
    name: "Bold Modern",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "font-black",
    textTransform: "uppercase" as const,
    letterSpacing: "tracking-wider",
    preview: "BOLD MODERN",
  },
  {
    id: "clean-sans",
    name: "Clean Sans",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "font-bold",
    textTransform: "none" as const,
    letterSpacing: "tracking-tight",
    preview: "Clean Sans",
  },
  {
    id: "elegant-serif",
    name: "Elegant Serif",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: "font-bold",
    textTransform: "none" as const,
    letterSpacing: "tracking-normal",
    preview: "Elegant Serif",
  },
  {
    id: "luxury",
    name: "Luxury",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: "font-normal",
    textTransform: "uppercase" as const,
    letterSpacing: "tracking-[0.25em]",
    preview: "LUXURY",
  },
  {
    id: "minimal",
    name: "Minimal Light",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "font-light",
    textTransform: "none" as const,
    letterSpacing: "tracking-normal",
    preview: "Minimal Light",
  },
  {
    id: "impact",
    name: "Impact",
    fontFamily: "'Arial Black', 'Impact', sans-serif",
    fontWeight: "font-black",
    textTransform: "uppercase" as const,
    letterSpacing: "tracking-tight",
    preview: "IMPACT",
  },
] as const;

export type HeroFontStyleId = (typeof HERO_FONT_STYLES)[number]["id"];

export const HERO_TEXT_SIZES = [
  { id: "sm", name: "Small", classes: "text-2xl sm:text-3xl" },
  { id: "md", name: "Medium", classes: "text-3xl sm:text-4xl md:text-5xl" },
  { id: "lg", name: "Large", classes: "text-4xl sm:text-5xl md:text-6xl" },
  { id: "xl", name: "Extra Large", classes: "text-5xl sm:text-6xl md:text-7xl" },
] as const;

export type HeroTextSizeId = (typeof HERO_TEXT_SIZES)[number]["id"];

export const HERO_TEXT_ALIGNMENTS = [
  { id: "left", name: "Left", icon: "AlignLeft" },
  { id: "center", name: "Center", icon: "AlignCenter" },
  { id: "right", name: "Right", icon: "AlignRight" },
] as const;

export type HeroTextAlignmentId = (typeof HERO_TEXT_ALIGNMENTS)[number]["id"];

export function getHeroFontStyle(id: string) {
  return HERO_FONT_STYLES.find((f) => f.id === id) ?? HERO_FONT_STYLES[1];
}

export function getHeroTextSize(id: string) {
  return HERO_TEXT_SIZES.find((s) => s.id === id) ?? HERO_TEXT_SIZES[1];
}
