import 'server-only';

import {
  readImageUpload,
  UNREADABLE_IMAGE_ERROR,
  type TImageFormat,
  type TImageUploadValidationResult,
} from '@platform/server/uploads/read-image-upload';
import {
  DIMENSION_BOUNDS_PX,
  MAX_UPLOAD_BYTES,
  maxUploadMbLabel,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { sanitizeSvgMarkup } from '@platform/utils/sanitize-svg-markup/sanitize-svg-markup';
import { imageSize } from 'image-size';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<string, TImageFormat> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  webp: { contentType: 'image/webp', extension: 'webp' },
  svg: { contentType: 'image/svg+xml', extension: 'svg' },
};

/**
 * SVG has no raster grid, so the pixel bounds don't apply; `image-size`
 * derives its width/height from the root `width`/`height` or `viewBox`
 * aspect ratio, which is what a browser tab renders the favicon at.
 */
const validateSvgAsset = (
  buffer: Buffer,
  kind: TBrandAssetKind,
  format: TImageFormat,
): TImageUploadValidationResult => {
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

  return { ok: true, asset: { buffer: sanitizedBuffer, ...format } };
};

/**
 * SVG is returned only as its sanitised bytes. Favicon square-ness is
 * enforced rather than advised because Vercel Blob has no on-the-fly
 * transforms, so what passes here is exactly what a browser tab renders.
 */
export const validateBrandAssetUpload = async (
  file: File,
  kind: TBrandAssetKind,
): Promise<TImageUploadValidationResult> => {
  const read = await readImageUpload(
    file,
    MAX_UPLOAD_BYTES[kind],
    maxUploadMbLabel(kind),
  );
  if (!read.ok) {
    return read;
  }
  const { buffer, type, width, height } = read.image;

  const format = type ? IMAGE_FORMAT_BY_DETECTED_TYPE[type] : undefined;
  if (!format) {
    return { ok: false, error: 'Choose a PNG, JPEG, WebP, or SVG image.' };
  }

  if (type === 'svg') {
    return validateSvgAsset(buffer, kind, format);
  }

  const bounds = DIMENSION_BOUNDS_PX[kind];
  if (width < bounds.min || height < bounds.min) {
    return {
      ok: false,
      error: `Image is too small — at least ${bounds.min}×${bounds.min}px.`,
    };
  }
  if (width > bounds.max || height > bounds.max) {
    return {
      ok: false,
      error: `Image is too large — at most ${bounds.max}×${bounds.max}px.`,
    };
  }

  if (kind === 'favicon' && width !== height) {
    return {
      ok: false,
      error: `Favicon must be a square image — this one is ${width}×${height}px. Crop it to a square before uploading.`,
    };
  }

  return { ok: true, asset: { buffer, ...format } };
};
