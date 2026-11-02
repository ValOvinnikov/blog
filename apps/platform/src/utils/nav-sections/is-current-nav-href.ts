import { adminRoutes, STUDIO_SEGMENT } from '@platform/utils/routes/routes';

const isAddTenantUnderTenants = (href: string, pathname: string) =>
  pathname === adminRoutes.newTenant() && href === adminRoutes.tenants();

const isInsideStudio = (href: string, pathname: string) =>
  href.endsWith(`/${STUDIO_SEGMENT}`) && pathname.startsWith(`${href}/`);

export const isCurrentNavHref = (href: string, pathname: string) =>
  pathname === href ||
  isAddTenantUnderTenants(href, pathname) ||
  isInsideStudio(href, pathname);
