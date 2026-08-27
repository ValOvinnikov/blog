'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@admin/components/shared/breadcrumbs';
import { usePathname } from '@admin/i18n/navigation';
import { getTenantNameAction } from '@admin/server/tenants/get-tenant-name-action';
import { adminRoutes } from '@admin/utils/routes/routes';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * `(platform)/layout.tsx`'s breadcrumb — wraps four route shapes
 * (`/tenants`, `/add-tenant`, the `/tenants/{id}` overview, and
 * `/tenants/{id}/provisioning`) that layout can't tell apart from its own
 * `params` (its directory path has no `[tenantId]` segment at all), so both
 * the current leaf and the tenant id are read at runtime instead: the leaf
 * from the pathname, `tenantId` from `useParams` (which, unlike a layout's
 * typed `params` prop, reflects every dynamic segment the matched route
 * filled in, regardless of which ancestor defines it). The tenant's name
 * isn't available from either, so it's fetched once `tenantId` is known.
 */
export const PlatformBreadcrumb = () => {
  const pathname = usePathname();
  const { tenantId } = useParams<{ tenantId?: string }>();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');
  const tBreadcrumb = useTranslations('platformBreadcrumb');
  const [renderedTenantId, setRenderedTenantId] = useState(tenantId);
  const [tenantName, setTenantName] = useState<string>();

  // A tenant id change (navigating from one tenant's page straight to
  // another's) must drop the previous tenant's name immediately, rather
  // than showing it stale until the new fetch below resolves.
  if (tenantId !== renderedTenantId) {
    setRenderedTenantId(tenantId);
    setTenantName(undefined);
  }

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let cancelled = false;
    getTenantNameAction(tenantId).then((name) => {
      if (!cancelled) {
        setTenantName(name);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const platform: TBreadcrumbItem = { label: t('platformLabel') };
  const tenants: TBreadcrumbItem = {
    label: t('tenants'),
    href: adminRoutes.tenants(),
  };

  const items: TBreadcrumbItem[] = (() => {
    if (tenantId) {
      if (pathname === adminRoutes.tenantProvisioning(tenantId)) {
        return [
          platform,
          tenants,
          {
            label: tenantName ?? '',
            href: adminRoutes.tenantOverview(tenantId),
          },
          { label: tBreadcrumb('provisioningLabel') },
        ];
      }
      return [platform, tenants, { label: tenantName ?? '' }];
    }
    if (pathname === adminRoutes.addTenant()) {
      return [platform, tenants, { label: t('addTenant') }];
    }
    return [platform, { label: t('tenants') }];
  })();

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
