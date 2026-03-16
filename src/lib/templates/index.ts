import type { BusinessTemplate } from "./types";
import { barberTemplate } from "./barber";
import { beautyTemplate } from "./beauty";
import { fitnessTemplate } from "./fitness";
import { tutorTemplate } from "./tutor";
import { clinicTemplate } from "./clinic";
import { genericTemplate } from "./generic";

export type { BusinessTemplate, ServiceTemplate, HoursTemplate } from "./types";

const TEMPLATES: Record<string, BusinessTemplate> = {
  BARBER: barberTemplate,
  BEAUTY: beautyTemplate,
  FITNESS: fitnessTemplate,
  TUTOR: tutorTemplate,
  CLINIC: clinicTemplate,
  GENERIC: genericTemplate,
};

export function getTemplate(businessType: string): BusinessTemplate {
  return TEMPLATES[businessType] ?? genericTemplate;
}
