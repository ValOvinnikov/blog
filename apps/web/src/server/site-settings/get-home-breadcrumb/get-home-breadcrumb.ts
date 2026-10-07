import { routes } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { notFound } from 'next/navigation';

export const getHomeBreadcrumb = async (): Promise<IBreadcrumbItem> => {
  const result = await getSiteSettings();
  // The locale layout logs this failure from the same cached call.
  if (!result.ok) notFound();

  return { label: result.data.brand.name, href: routes.home() };
};
