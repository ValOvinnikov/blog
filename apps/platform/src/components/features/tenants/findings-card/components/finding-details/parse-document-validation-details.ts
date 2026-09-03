import type { TSanityValidationMarkerLevel } from '@platform/utils/status-tone/status-tone';

export type TSanityValidationMarker = {
  level: TSanityValidationMarkerLevel;
  message: string;
};

export type TSanityValidationResult = {
  documentId: string;
  documentType: string;
  markers: TSanityValidationMarker[];
};

export type TDocumentValidationDetails = {
  invalidDocumentCount: number;
  documents: TSanityValidationResult[];
};

const MARKER_LEVELS: TSanityValidationMarkerLevel[] = [
  'error',
  'warning',
  'info',
];

const isMarkerLevel = (value: unknown): value is TSanityValidationMarkerLevel =>
  typeof value === 'string' &&
  MARKER_LEVELS.includes(value as TSanityValidationMarkerLevel);

const isMarker = (value: unknown): value is TSanityValidationMarker => {
  if (typeof value !== 'object' || value === null) return false;
  const marker = value as Record<string, unknown>;
  return isMarkerLevel(marker.level) && typeof marker.message === 'string';
};

const isValidationResult = (
  value: unknown,
): value is TSanityValidationResult => {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.documentId === 'string' &&
    typeof result.documentType === 'string' &&
    Array.isArray(result.markers) &&
    result.markers.every(isMarker)
  );
};

/**
 * Recognizes the `DOCUMENT_VALIDATION`/`SCHEMA_VALIDATION_ERROR` finding
 * shape; returns `null` for anything else so the caller can fall back to a
 * raw dump.
 */
export const parseDocumentValidationDetails = (
  details: Record<string, unknown>,
): TDocumentValidationDetails | null => {
  const { invalidDocumentCount, documents } = details;
  if (typeof invalidDocumentCount !== 'number' || !Array.isArray(documents)) {
    return null;
  }
  if (!documents.every(isValidationResult)) {
    return null;
  }
  return { invalidDocumentCount, documents };
};
