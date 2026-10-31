const STUDIO_ENTERED_COOKIE_PREFIX = 'studio-entered-';

export const studioEnteredCookie = (tenantId: string): string =>
  `${STUDIO_ENTERED_COOKIE_PREFIX}${tenantId}`;
