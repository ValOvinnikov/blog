import 'server-only';

import {
  DIMENSION_BOUNDS_PX,
  MAX_UPLOAD_BYTES,
  maxUploadMbLabel,
  type TBrandAssetKind,
} from '@admin/utils/brand-asset-limits/brand-asset-limits';
import { imageSize } from 'image-size';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<
  string,
  { contentType: string; extension: string }
> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  webp: { contentType: 'image/webp', extension: 'webp' },
};

type TValidatedBrandAsset = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

export type TBrandAssetValidationResult =
  { ok: true; asset: TValidatedBrandAsset } | { ok: false; error: string };

/**
 * The authoritative upload gate — a browser-reported `File.type`/`.size` is
 * attacker-controlled input, not proof of what was actually sent, so this
 * re-derives everything from the real bytes. `image-size` reads the file's
 * magic-number/header bytes rather than trusting the declared type, and
 * doubles as the format allow-list: only PNG/JPEG/WebP map to a
 * `contentType` below, so anything else — SVG included — falls through to
 * "unsupported" (SVG needs script/handler sanitization this app doesn't do,
 * so it isn't accepted for now). Favicon square-ness is enforced here, not
 * advisory: Vercel Blob has no on-the-fly transforms, so whatever passes
 * this check is exactly what a browser tab renders at 16–32px.
 */
export async function validateBrandAssetUpload(
  file: File,
  kind: TBrandAssetKind,
): Promise<TBrandAssetValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: 'Choose a file to upload.' };
  }

  const maxBytes = MAX_UPLOAD_BYTES[kind];
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `That file is too large — the limit is ${maxUploadMbLabel(kind)}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let dimensions;
  try {
    dimensions = imageSize(buffer);
  } catch {
    return { ok: false, error: "That file isn't a readable image." };
  }

  const format = dimensions.type
    ? IMAGE_FORMAT_BY_DETECTED_TYPE[dimensions.type]
    : undefined;
  if (!format) {
    return { ok: false, error: 'Choose a PNG, JPEG, or WebP image.' };
  }

  const bounds = DIMENSION_BOUNDS_PX[kind];
  if (dimensions.width < bounds.min || dimensions.height < bounds.min) {
    return {
      ok: false,
      error: `Image is too small — at least ${bounds.min}×${bounds.min}px.`,
    };
  }
  if (dimensions.width > bounds.max || dimensions.height > bounds.max) {
    return {
      ok: false,
      error: `Image is too large — at most ${bounds.max}×${bounds.max}px.`,
    };
  }

  if (kind === 'favicon' && dimensions.width !== dimensions.height) {
    return {
      ok: false,
      error: `Favicon must be a square image — this one is ${dimensions.width}×${dimensions.height}px. Crop it to a square before uploading.`,
    };
  }

  return {
    ok: true,
    asset: {
      buffer,
      contentType: format.contentType,
      extension: format.extension,
    },
  };
}
