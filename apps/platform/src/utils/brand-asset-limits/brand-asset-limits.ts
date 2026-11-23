import type { TMaybeUndefined } from '@shinefold/config';
import { z } from 'zod';

export const brandAssetKindSchema = z.enum(['logo', 'logoDark', 'favicon']);
export type TBrandAssetKind = z.infer<typeof brandAssetKindSchema>;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
type TAcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

const MB = 1024 * 1024;
const LOGO_MAX_UPLOAD_BYTES = 4 * MB;
const LOGO_DIMENSION_BOUNDS_PX = { min: 32, max: 4000 };

// Blob serves the favicon byte-for-byte with no resize step, so its cap is far tighter than a logo's.
export const MAX_UPLOAD_BYTES: Record<TBrandAssetKind, number> = {
  logo: LOGO_MAX_UPLOAD_BYTES,
  logoDark: LOGO_MAX_UPLOAD_BYTES,
  favicon: 1 * MB,
};

// A nicety for the logo (reject absurd uploads); a real constraint for the
// favicon, since 16–32px is what a browser tab actually renders it at.
export const DIMENSION_BOUNDS_PX: Record<
  TBrandAssetKind,
  { min: number; max: number }
> = {
  logo: LOGO_DIMENSION_BOUNDS_PX,
  logoDark: LOGO_DIMENSION_BOUNDS_PX,
  favicon: { min: 16, max: 512 },
};

export const maxUploadMbLabel = (kind: TBrandAssetKind): string => {
  return `${(MAX_UPLOAD_BYTES[kind] / MB).toFixed(1)} MB`;
};

export type TBrandAssetQuickCheckError =
  { key: 'unsupportedType' } | { key: 'tooLarge'; limit: string };

/**
 * Client-side convenience only — `validateBrandAssetUpload` on the server is
 * the actual gate, since it sniffs the real bytes and enforces favicon
 * square-ness, neither of which a browser-reported `File.type`/`.size` can
 * prove.
 */
export const quickClientImageCheck = (
  file: File,
  kind: TBrandAssetKind,
): TMaybeUndefined<TBrandAssetQuickCheckError> => {
  if (
    !ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as TAcceptedImageMimeType)
  ) {
    return { key: 'unsupportedType' };
  }

  if (file.size > MAX_UPLOAD_BYTES[kind]) {
    return { key: 'tooLarge', limit: maxUploadMbLabel(kind) };
  }

  return undefined;
};
