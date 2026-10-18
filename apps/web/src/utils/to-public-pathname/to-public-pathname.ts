import { isLocaleIsoCode } from '@blog/config';
import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';

export const toPublicPathname = (pathname: string): string => {
  const [, tenantId = '', locale = '', ...rest] = pathname.split('/');

  return isValidTenantId(tenantId) && isLocaleIsoCode(locale)
    ? `/${rest.join('/')}`
    : pathname;
};
