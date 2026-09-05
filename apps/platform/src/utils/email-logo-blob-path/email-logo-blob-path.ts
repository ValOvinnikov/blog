import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';

/**
 * Distinct from the site logo's `tenants/{id}/{kind}.{ext}` path — an email
 * logo and a site logo must never collide in Vercel Blob even for the same
 * tenant.
 */
export const buildEmailLogoBlobPath = (
  tenantId: string,
  target: TEmailLogoTarget,
  extension: string,
): string => {
  if (target.type === 'tenant') {
    return `tenants/${tenantId}/email-logo.${extension}`;
  }

  return `tenants/${tenantId}/email-logo-${target.templateType.toLowerCase()}.${extension}`;
};
