import 'server-only';

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
  const { buffer, type, width, height } = read.image;

  if (type === 'svg') {
    return {
      ok: false,
      error:
        'SVG logos are not supported — Gmail, Outlook and Yahoo do not render SVG in email, so this would ship as a missing image.',
    };
  }
  if (type === 'webp') {
    return {
      ok: false,
      error:
        "WebP logos are not supported — too many email clients don't render WebP reliably.",
    };
  }

  const format = type ? IMAGE_FORMAT_BY_DETECTED_TYPE[type] : undefined;
  if (!format) {
    return { ok: false, error: 'Choose a PNG, JPEG, or GIF image.' };
  }

  if (
    width > EMAIL_LOGO_MAX_DIMENSION_PX ||
    height > EMAIL_LOGO_MAX_DIMENSION_PX
  ) {
    return {
      ok: false,
      error: `Image is too large — at most ${EMAIL_LOGO_MAX_DIMENSION_PX}×${EMAIL_LOGO_MAX_DIMENSION_PX}px.`,
    };
  }

  return { ok: true, asset: { buffer, ...format } };
};
