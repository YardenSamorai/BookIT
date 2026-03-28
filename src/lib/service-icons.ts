import {
  Sparkles, Scissors, Heart, Stethoscope, Dumbbell, Coffee,
  Camera, Palette, Wrench, Car, BookOpen, GraduationCap,
  Music, Mic, Shirt, Gem, Crown, Star, Flower2, Leaf,
  Baby, Dog, Brush, PaintBucket, Syringe, Pill, Eye,
  HandMetal, Footprints, Wand2, ShowerHead, Sun, Moon,
  Flame, Snowflake, Zap, Wind, Waves, Mountain,
  Bike, Trophy, Timer, Target, Shell, Feather,
  type LucideIcon,
} from "lucide-react";
import { NailPolishIcon } from "@/components/icons/nail-polish-icon";

export interface IconCategory {
  label_he: string;
  label_en: string;
  icons: { name: string; label_he: string; Icon: LucideIcon }[];
}

export const SERVICE_ICON_CATEGORIES: IconCategory[] = [
  {
    label_he: "יופי וטיפוח",
    label_en: "Beauty",
    icons: [
      { name: "nail-polish", label_he: "לק", Icon: NailPolishIcon as unknown as LucideIcon },
      { name: "sparkles", label_he: "נצנצים", Icon: Sparkles },
      { name: "scissors", label_he: "מספריים", Icon: Scissors },
      { name: "gem", label_he: "יהלום", Icon: Gem },
      { name: "crown", label_he: "כתר", Icon: Crown },
      { name: "flower", label_he: "פרח", Icon: Flower2 },
      { name: "brush", label_he: "מברשת", Icon: Brush },
      { name: "paint-bucket", label_he: "צבע", Icon: PaintBucket },
      { name: "wand", label_he: "שרביט", Icon: Wand2 },
      { name: "eye", label_he: "עין", Icon: Eye },
      { name: "feather", label_he: "נוצה", Icon: Feather },
      { name: "shell", label_he: "צדף", Icon: Shell },
    ],
  },
  {
    label_he: "בריאות ורפואה",
    label_en: "Health",
    icons: [
      { name: "stethoscope", label_he: "סטטוסקופ", Icon: Stethoscope },
      { name: "heart", label_he: "לב", Icon: Heart },
      { name: "syringe", label_he: "מזרק", Icon: Syringe },
      { name: "pill", label_he: "כדור", Icon: Pill },
      { name: "leaf", label_he: "עלה", Icon: Leaf },
    ],
  },
  {
    label_he: "כושר וספורט",
    label_en: "Fitness",
    icons: [
      { name: "dumbbell", label_he: "משקולת", Icon: Dumbbell },
      { name: "bike", label_he: "אופניים", Icon: Bike },
      { name: "trophy", label_he: "גביע", Icon: Trophy },
      { name: "timer", label_he: "טיימר", Icon: Timer },
      { name: "target", label_he: "מטרה", Icon: Target },
      { name: "flame", label_he: "להבה", Icon: Flame },
      { name: "zap", label_he: "ברק", Icon: Zap },
      { name: "mountain", label_he: "הר", Icon: Mountain },
    ],
  },
  {
    label_he: "אוכל ומשקאות",
    label_en: "Food",
    icons: [
      { name: "coffee", label_he: "קפה", Icon: Coffee },
    ],
  },
  {
    label_he: "ילדים ובע״ח",
    label_en: "Kids & Pets",
    icons: [
      { name: "baby", label_he: "תינוק", Icon: Baby },
      { name: "dog", label_he: "כלב", Icon: Dog },
      { name: "footprints", label_he: "עקבות", Icon: Footprints },
    ],
  },
  {
    label_he: "יצירה ולמידה",
    label_en: "Creative",
    icons: [
      { name: "camera", label_he: "מצלמה", Icon: Camera },
      { name: "palette", label_he: "פלטה", Icon: Palette },
      { name: "music", label_he: "מוזיקה", Icon: Music },
      { name: "mic", label_he: "מיקרופון", Icon: Mic },
      { name: "book-open", label_he: "ספר", Icon: BookOpen },
      { name: "graduation", label_he: "סיום", Icon: GraduationCap },
    ],
  },
  {
    label_he: "רכב ושירותים",
    label_en: "Auto & Services",
    icons: [
      { name: "wrench", label_he: "מפתח ברגים", Icon: Wrench },
      { name: "car", label_he: "רכב", Icon: Car },
    ],
  },
  {
    label_he: "ספא ורגיעה",
    label_en: "Spa",
    icons: [
      { name: "shower", label_he: "מקלחת", Icon: ShowerHead },
      { name: "sun", label_he: "שמש", Icon: Sun },
      { name: "moon", label_he: "ירח", Icon: Moon },
      { name: "waves", label_he: "גלים", Icon: Waves },
      { name: "wind", label_he: "רוח", Icon: Wind },
      { name: "snowflake", label_he: "פתית שלג", Icon: Snowflake },
    ],
  },
  {
    label_he: "אחר",
    label_en: "Other",
    icons: [
      { name: "star", label_he: "כוכב", Icon: Star },
      { name: "shirt", label_he: "חולצה", Icon: Shirt },
      { name: "hand", label_he: "יד", Icon: HandMetal },
    ],
  },
];

const ICON_MAP: Record<string, LucideIcon> = {};
for (const cat of SERVICE_ICON_CATEGORIES) {
  for (const icon of cat.icons) {
    ICON_MAP[icon.name] = icon.Icon;
  }
}

export function getServiceIcon(name: string | undefined | null): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}
