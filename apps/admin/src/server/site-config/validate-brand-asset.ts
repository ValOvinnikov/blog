import 'server-only';

import {
  DIMENSION_BOUNDS_PX,
  MAX_UPLOAD_BYTES,
  maxUploadMbLabel,
  type TBrandAssetKind,
} from '@admin/utils/brand-asset-limits/brand-asset-limits';
import { sanitizeSvgMarkup } from '@admin/utils/sanitize-svg-markup/sanitize-svg-markup';
import { imageSize } from 'image-size';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<
  string,
  { contentType: string; extension: string }
> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  webp: { contentType: 'image/webp', extension: 'webp' },
  svg: { contentType: 'image/svg+xml', extension: 'svg' },
};

type TValidatedBrandAsset = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

export type TBrandAssetValidationResult =
  { ok: true; asset: TValidatedBrandAsset } | { ok: false; error: string };

const UNREADABLE_IMAGE_ERROR = "That file isn't a readable image.";

/**
 * SVG has no fixed raster grid the way PNG/JPEG/WebP do, so neither
 * `DIMENSION_BOUNDS_PX` (a byte-size sanity check, meaningless for a format
 * that's the same file at every render size) nor a pixel-perfect square
 * check applies. `image-size`'s own SVG handling already computes an
 * effective width/height from the root `<svg>`'s `width`/`height`
 * attributes, falling back to the `viewBox` aspect ratio when those are
 * absent — that ratio is what a browser tab actually renders the icon at,
 * so it's the right proxy for "is this square", even though it isn't a
 * literal pixel count the way a PNG's IHDR chunk is.
 */
function validateSvgAsset(
  buffer: Buffer,
  kind: TBrandAssetKind,
  format: { contentType: string; extension: string },
): TBrandAssetValidationResult {
  const sanitized = sanitizeSvgMarkup(buffer.toString('utf-8'));
  if (!sanitized) {
    return { ok: false, error: UNREADABLE_IMAGE_ERROR };
  }
  const sanitizedBuffer = Buffer.from(sanitized, 'utf-8');

  if (kind === 'favicon') {
    let dimensions;
    try {
      dimensions = imageSize(sanitizedBuffer);
    } catch {
      return { ok: false, error: UNREADABLE_IMAGE_ERROR };
    }
    if (dimensions.width !== dimensions.height) {
      return {
        ok: false,
        error: `Favicon must be a square image — this one is ${dimensions.width}×${dimensions.height}px (from its viewBox/width/height). Crop it to a square before uploading.`,
      };
    }
  }

  return {
    ok: true,
    asset: {
      buffer: sanitizedBuffer,
      contentType: format.contentType,
      extension: format.extension,
    },
  };
}

/**
 * The authoritative upload gate — a browser-reported `File.type`/`.size` is
 * attacker-controlled input, not proof of what was actually sent, so this
 * re-derives everything from the real bytes. `image-size` reads the file's
 * magic-number/header bytes rather than trusting the declared type, and
 * doubles as the format allow-list: only PNG/JPEG/WebP/SVG map to a
 * `contentType` below, so anything else falls through to "unsupported". SVG
 * additionally runs through `sanitizeSvgMarkup` — real markup parsing that
 * strips `<script>`, event-handler attributes, and any URI reference — a
 * direct attribute value or a CSS `url(...)` target in an attribute or a
 * `<style>` element — that isn't a same-document fragment or `data:` URI —
 * before its sanitized (not original) bytes
 * are ever returned; the raster formats need no such pass, since `image-size`
 * only ever reads their header bytes, never anything that gets echoed back
 * out. Favicon square-ness is enforced here, not advisory: Vercel Blob has no
 * on-the-fly transforms, so whatever passes this check is exactly what a
 * browser tab renders at 16–32px.
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
    return { ok: false, error: UNREADABLE_IMAGE_ERROR };
  }

  const format = dimensions.type
    ? IMAGE_FORMAT_BY_DETECTED_TYPE[dimensions.type]
    : undefined;
  if (!format) {
    return { ok: false, error: 'Choose a PNG, JPEG, WebP, or SVG image.' };
  }

  if (dimensions.type === 'svg') {
    return validateSvgAsset(buffer, kind, format);
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
