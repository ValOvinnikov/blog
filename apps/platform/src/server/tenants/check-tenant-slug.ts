import {
  DOMAIN_LABEL_PATTERN,
  RESERVED_SUBDOMAINS,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';

export type TTenantSlugError =
  | typeof TENANT_FIELD_ERROR.SLUG_INVALID
  | typeof TENANT_FIELD_ERROR.SLUG_RESERVED
  | typeof TENANT_FIELD_ERROR.SLUG_TAKEN;

const isReservedSubdomain = (slug: string): boolean =>
  RESERVED_SUBDOMAINS.some((reserved) => reserved === slug);

export const checkTenantSlug = async (
  slug: string,
  rootDomain: string,
): Promise<TMaybeUndefined<TTenantSlugError>> => {
  if (!DOMAIN_LABEL_PATTERN.test(slug)) return TENANT_FIELD_ERROR.SLUG_INVALID;
  if (isReservedSubdomain(slug)) return TENANT_FIELD_ERROR.SLUG_RESERVED;

  const tenant = await queries.tenantDomains.getTenantByDomain(
    `${slug}.${rootDomain}`,
  );
  return tenant ? TENANT_FIELD_ERROR.SLUG_TAKEN : undefined;
};
