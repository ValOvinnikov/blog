import { z } from 'zod';

export const brandAssetKindSchema = z.enum(['logo', 'favicon']);
export type TBrandAssetKind = z.infer<typeof brandAssetKindSchema>;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;
type TAcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

const MB = 1024 * 1024;

// Logos are visual branding rendered at whatever size a template wants;
// favicons are the browser-tab icon Vercel Blob serves byte-for-byte with no
// resize step, so its cap stays far tighter than "a few MB" — both are
// generously above the "tens-of-KB" size either asset actually needs.
export const MAX_UPLOAD_BYTES: Record<TBrandAssetKind, number> = {
  logo: 4 * MB,
  favicon: 1 * MB,
};

// A nicety for the logo (reject absurd uploads); a real constraint for the
// favicon, since 16–32px is what a browser tab actually renders it at.
export const DIMENSION_BOUNDS_PX: Record<
  TBrandAssetKind,
  { min: number; max: number }
> = {
  logo: { min: 32, max: 4000 },
  favicon: { min: 16, max: 512 },
};

export function maxUploadMbLabel(kind: TBrandAssetKind): string {
  return `${(MAX_UPLOAD_BYTES[kind] / MB).toFixed(1)} MB`;
}

/**
 * Client-side convenience only — catches an obviously wrong file (wrong
 * type, way too large) before a round trip. `validateBrandAssetUpload` on
 * the server is the actual gate: it sniffs the real bytes and enforces
 * favicon square-ness, neither of which a browser-reported `File.type`/
 * `.size` can prove.
 */
export function quickClientImageCheck(
  file: File,
  kind: TBrandAssetKind,
): string | undefined {
  if (
    !ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as TAcceptedImageMimeType)
  ) {
    return 'Choose a PNG, JPEG, WebP, or SVG image.';
  }

  if (file.size > MAX_UPLOAD_BYTES[kind]) {
    return `That file is too large — the limit is ${maxUploadMbLabel(kind)}.`;
  }

  return undefined;
}
