import {
  DOMAIN_LABEL_PATTERN,
  RESERVED_SUBDOMAINS,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';

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

export const checkTenantDomainSlug = async (
  domain: string,
): Promise<TMaybeUndefined<TTenantSlugError>> => {
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) return undefined;

  const suffix = `.${rootDomain}`;
  if (!domain.endsWith(suffix)) return undefined;

  const slug = domain.slice(0, -suffix.length);
  if (slug.includes('.')) return undefined;

  return checkTenantSlug(slug, rootDomain);
};
