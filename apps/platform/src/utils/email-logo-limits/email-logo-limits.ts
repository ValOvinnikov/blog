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

export type TEmailLogoQuickCheckError =
  { key: 'unsupportedType' } | { key: 'tooLarge'; limit: string };

/**
 * Client-side convenience only — catches an obviously wrong file before a
 * round trip. `validateEmailLogoUpload` on the server is the actual gate.
 * Returns a message key rather than translated text: a plain utility
 * function has no `useTranslations` to call, so the caller (a client
 * component) translates using the key and any interpolation values here.
 */
export const quickClientEmailLogoCheck = (
  file: File,
): TEmailLogoQuickCheckError | undefined => {
  if (
    !ACCEPTED_EMAIL_LOGO_MIME_TYPES.includes(
      file.type as TAcceptedEmailLogoMimeType,
    )
  ) {
    return { key: 'unsupportedType' };
  }

  if (file.size > MAX_EMAIL_LOGO_BYTES) {
    return { key: 'tooLarge', limit: maxEmailLogoKbLabel() };
  }

  return undefined;
};
