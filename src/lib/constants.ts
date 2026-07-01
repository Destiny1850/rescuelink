/**
 * Espejo en TypeScript de los ENUM definidos en 001_initial_schema.sql.
 * Mantener sincronizado manualmente si se agregan valores al schema.
 */

export const ANIMAL_SPECIES = ['dog', 'cat', 'other'] as const;
export type AnimalSpecies = (typeof ANIMAL_SPECIES)[number];

export const ANIMAL_SIZES = ['small', 'medium', 'large'] as const;
export type AnimalSize = (typeof ANIMAL_SIZES)[number];

export const ANIMAL_STATUSES = ['available', 'foster', 'adopted', 'urgent'] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

export const APPLICATION_STATUSES = ['pending', 'reviewed', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const HOUSE_TYPES = ['apartment', 'house_with_yard', 'house_no_yard', 'farm', 'other'] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];

// --- Etiquetas legibles para la UI (evita strings mágicos repetidos) ---

export const SPECIES_LABELS: Record<AnimalSpecies, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export const SIZE_LABELS: Record<AnimalSize, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
};

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  available: 'Disponible',
  foster: 'En hogar temporal',
  adopted: 'Adoptado',
  urgent: 'Urgente',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  apartment: 'Apartamento',
  house_with_yard: 'Casa con patio',
  house_no_yard: 'Casa sin patio',
  farm: 'Finca / rural',
  other: 'Otro',
};

// Tags de personalidad sugeridos al crear un animal (autocompletado, no restrictivo)
export const SUGGESTED_PERSONALITY_TAGS = [
  'juguetón',
  'tranquilo',
  'bueno con niños',
  'bueno con otros perros',
  'bueno con gatos',
  'entrenado en casa',
  'tímido',
  'sociable',
  'necesita experiencia previa',
  'senior',
];
