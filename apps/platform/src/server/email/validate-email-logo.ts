import 'server-only';

import {
  EMAIL_LOGO_MAX_DIMENSION_PX,
  MAX_EMAIL_LOGO_BYTES,
  maxEmailLogoKbLabel,
} from '@platform/utils/email-logo-limits/email-logo-limits';
import { imageSize } from 'image-size';

const IMAGE_FORMAT_BY_DETECTED_TYPE: Record<
  string,
  { contentType: string; extension: string }
> = {
  png: { contentType: 'image/png', extension: 'png' },
  jpg: { contentType: 'image/jpeg', extension: 'jpg' },
  gif: { contentType: 'image/gif', extension: 'gif' },
};

type TValidatedEmailLogo = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

export type TEmailLogoValidationResult =
  { ok: true; asset: TValidatedEmailLogo } | { ok: false; error: string };

const UNREADABLE_IMAGE_ERROR = "That file isn't a readable image.";

/**
 * The authoritative upload gate for an email logo — deliberately distinct
 * from `validateBrandAssetUpload` (the site logo/favicon validator): email
 * clients, not browsers, decide what survives here, and their limits are
 * tighter on every axis. `image-size` reads the file's real header bytes
 * rather than trusting a browser-reported `File.type`, and doubles as the
 * format allow-list — only PNG/JPEG/GIF map to a `contentType`. SVG is
 * rejected here even though `image-size` can read it and even though the
 * site-logo validator accepts and sanitises it: SVG renders as nothing in
 * Gmail, Outlook and Yahoo, so accepting it here would ship an invisible
 * logo. WebP is rejected for the same reason — inbox support is patchy.
 */
export const validateEmailLogoUpload = async (
  file: File,
): Promise<TEmailLogoValidationResult> => {
  if (file.size === 0) {
    return { ok: false, error: 'Choose a file to upload.' };
  }

  if (file.size > MAX_EMAIL_LOGO_BYTES) {
    return {
      ok: false,
      error: `That file is too large — the limit is ${maxEmailLogoKbLabel()}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let dimensions;
  try {
    dimensions = imageSize(buffer);
  } catch {
    return { ok: false, error: UNREADABLE_IMAGE_ERROR };
  }

  if (dimensions.type === 'svg') {
    return {
      ok: false,
      error:
        'SVG logos are not supported — Gmail, Outlook and Yahoo do not render SVG in email, so this would ship as a missing image.',
    };
  }
  if (dimensions.type === 'webp') {
    return {
      ok: false,
      error:
        "WebP logos are not supported — too many email clients don't render WebP reliably.",
    };
  }

  const format = dimensions.type
    ? IMAGE_FORMAT_BY_DETECTED_TYPE[dimensions.type]
    : undefined;
  if (!format) {
    return { ok: false, error: 'Choose a PNG, JPEG, or GIF image.' };
  }

  if (
    dimensions.width > EMAIL_LOGO_MAX_DIMENSION_PX ||
    dimensions.height > EMAIL_LOGO_MAX_DIMENSION_PX
  ) {
    return {
      ok: false,
      error: `Image is too large — at most ${EMAIL_LOGO_MAX_DIMENSION_PX}×${EMAIL_LOGO_MAX_DIMENSION_PX}px.`,
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
};
