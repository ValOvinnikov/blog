import 'server-only';

import { ACTION_OUTCOME } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import {
  readImageUpload,
  type TImageFormat,
  type TImageUploadValidationResult,
} from '@platform/server/uploads/read-image-upload';
import {
  DIMENSION_BOUNDS_PX,
  MAX_UPLOAD_BYTES,
  maxUploadMbLabel,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { imageSize } from 'image-size';

import { sanitizeSvgMarkup } from './sanitize-svg-markup';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<string, TImageFormat> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  webp: { contentType: 'image/webp', extension: 'webp' },
  svg: { contentType: 'image/svg+xml', extension: 'svg' },
};

// `image-size` reads an SVG's size from its root `width`/`height` or `viewBox`, which is what a browser tab renders the favicon at.
const validateSvgAsset = async (
  buffer: Buffer,
  kind: TBrandAssetKind,
  format: TImageFormat,
): Promise<TImageUploadValidationResult> => {
  let sanitized;
  try {
    sanitized = await sanitizeSvgMarkup(buffer.toString('utf-8'));
  } catch (error) {
    logger.error(SITE_CONFIG_LOG.SVG_SANITIZE_FAILED, {
      kind,
      ...toLoggableError(error),
    });
    return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
  }
  if (!sanitized) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
    });
  }
  const sanitizedBuffer = Buffer.from(sanitized, 'utf-8');

  if (kind === 'favicon') {
    let dimensions;
    try {
      dimensions = imageSize(sanitizedBuffer);
    } catch {
      return errorResult({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
      });
    }
    const { width, height } = dimensions;
    if (width !== height) {
      return errorResult({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.SVG_FAVICON_NOT_SQUARE,
        values: { width, height },
      });
    }
  }

  return okResult({ buffer: sanitizedBuffer, ...format });
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
  const { buffer, type, width, height } = read.data;

  const format = type ? IMAGE_FORMAT_BY_DETECTED_TYPE[type] : undefined;
  if (!format) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED,
    });
  }

  if (type === 'svg') {
    return validateSvgAsset(buffer, kind, format);
  }

  const bounds = DIMENSION_BOUNDS_PX[kind];
  if (width < bounds.min || height < bounds.min) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.IMAGE_TOO_SMALL,
      values: { size: bounds.min },
    });
  }
  if (width > bounds.max || height > bounds.max) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.IMAGE_TOO_LARGE,
      values: { size: bounds.max },
    });
  }

  if (kind === 'favicon' && width !== height) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FAVICON_NOT_SQUARE,
      values: { width, height },
    });
  }

  return okResult({ buffer, ...format });
};
