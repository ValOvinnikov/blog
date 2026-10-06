import { RESERVED_SLUGS } from '@blog/config/constants';
import type { SlugValue, ValidationContext } from 'sanity';

export const LANDING_SLUG_SLASH_ERROR =
  'A slug is a single part of the URL and can\'t contain "/". To nest this page, choose a parent page.';

export const landingSlugReservedError = (slug: string): string =>
  `"${slug}" is a reserved path and can't be used as a top-level page slug.`;

export const validateLandingSlug = (
  value: SlugValue | undefined,
  context: ValidationContext,
): string | true => {
  const current = value?.current;

  if (!current) return true;

  if (current.includes('/')) return LANDING_SLUG_SLASH_ERROR;

  const isTopLevel = !context.document?.parent;

  if (isTopLevel && (RESERVED_SLUGS as readonly string[]).includes(current)) {
    return landingSlugReservedError(current);
  }

  return true;
};
