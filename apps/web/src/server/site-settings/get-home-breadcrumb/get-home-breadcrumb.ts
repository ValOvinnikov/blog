import { routes } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { notFound } from 'next/navigation';

export const getHomeBreadcrumb = async (): Promise<IBreadcrumbItem> => {
  const brandName = await getBrandName(await getRequestContext());
  if (!brandName) notFound();

  return { label: brandName, href: routes.home() };
};
