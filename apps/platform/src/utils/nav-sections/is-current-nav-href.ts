import { adminRoutes } from '@platform/utils/routes/routes';

const isAddTenantUnderTenants = (href: string, pathname: string) =>
  pathname === adminRoutes.newTenant() && href === adminRoutes.tenants();

export const isCurrentNavHref = (href: string, pathname: string) =>
  pathname === href || isAddTenantUnderTenants(href, pathname);
