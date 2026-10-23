import 'server-only';

import { ACTION_OUTCOME } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import {
  readImageUpload,
  type TImageFormat,
  type TImageUploadValidationResult,
} from '@platform/server/uploads/read-image-upload';
import {
  EMAIL_LOGO_MAX_DIMENSION_PX,
  MAX_EMAIL_LOGO_BYTES,
  maxEmailLogoKbLabel,
} from '@platform/utils/email-logo-limits/email-logo-limits';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<string, TImageFormat> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  gif: { contentType: 'image/gif', extension: 'gif' },
};

/**
 * Email clients, not browsers, decide what survives here, so SVG and WebP
 * are rejected even though the site-logo validator accepts them: Gmail,
 * Outlook and Yahoo render SVG as nothing, and WebP support is patchy.
 */
export const validateEmailLogoUpload = async (
  file: File,
): Promise<TImageUploadValidationResult> => {
  const read = await readImageUpload(
    file,
    MAX_EMAIL_LOGO_BYTES,
    maxEmailLogoKbLabel(),
  );
  if (!read.ok) {
    return read;
  }
  const { buffer, type, width, height } = read.data;

  if (type === 'svg') {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.EMAIL_LOGO_SVG,
    });
  }
  if (type === 'webp') {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.EMAIL_LOGO_WEBP,
    });
  }

  const format = type ? IMAGE_FORMAT_BY_DETECTED_TYPE[type] : undefined;
  if (!format) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.EMAIL_LOGO_TYPE_UNSUPPORTED,
    });
  }

  if (
    width > EMAIL_LOGO_MAX_DIMENSION_PX ||
    height > EMAIL_LOGO_MAX_DIMENSION_PX
  ) {
    return errorResult({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.IMAGE_TOO_LARGE,
      values: { size: EMAIL_LOGO_MAX_DIMENSION_PX },
    });
  }

  return okResult({ buffer, ...format });
};
