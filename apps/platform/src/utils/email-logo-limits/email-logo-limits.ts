// Email clients — not browsers — decide what a logo upload has to survive:
// Gmail/Outlook/Yahoo don't render SVG at all, and WebP support is patchy
// enough that a tenant who tests in a client that happens to render it would
// ship an invisible logo to everyone else. GIF is kept instead purely because
// it's a real inbox-safe raster format, not because animation is wanted.
export const ACCEPTED_EMAIL_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
] as const;
type TAcceptedEmailLogoMimeType =
  (typeof ACCEPTED_EMAIL_LOGO_MIME_TYPES)[number];

const KB = 1024;

// Recipients pay for these bytes on every open, and Gmail clips a message
// past a total size threshold — an email logo has no business anywhere near
// the multi-MB range a site logo tolerates.
export const MAX_EMAIL_LOGO_BYTES = 100 * KB;

// Email logos display at roughly 120-200px in an inbox; 400px comfortably
// covers 2x-retina rendering without shipping a needlessly heavy file.
export const EMAIL_LOGO_MAX_DIMENSION_PX = 400;

export const maxEmailLogoKbLabel = (): string => {
  return `${Math.round(MAX_EMAIL_LOGO_BYTES / KB)} KB`;
};

/**
 * Client-side convenience only — catches an obviously wrong file before a
 * round trip. `validateEmailLogoUpload` on the server is the actual gate.
 */
export const quickClientEmailLogoCheck = (file: File): string | undefined => {
  if (
    !ACCEPTED_EMAIL_LOGO_MIME_TYPES.includes(
      file.type as TAcceptedEmailLogoMimeType,
    )
  ) {
    return 'Choose a PNG, JPEG, or GIF image — SVG and WebP are not supported by major email clients.';
  }

  if (file.size > MAX_EMAIL_LOGO_BYTES) {
    return `That file is too large — the limit is ${maxEmailLogoKbLabel()}.`;
  }

  return undefined;
};
