import 'server-only';

import type { TTenant } from '@blog/db/schema/tenants';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type TTenantPageContent = (props: { tenant: TTenant }) => Promise<ReactNode>;

/**
 * Shared body of a dashboard/tenant route page pair: resolve which tenant
 * is in scope (the dashboard route from the session's memberships, the
 * `/t/[tenantSlug]` route from the URL param) and hand it to the shared
 * `*PageContent` renderer both variants render. Called directly, not as
 * JSX — an async component nested via JSX only resolves under React's real
 * RSC renderer, which this repo's `customRenderAsync` test helper doesn't
 * emulate.
 */
export const renderTenantScopedPage = async <T extends { tenant: TTenant }>(
  resolveTenant: () => Promise<T>,
  PageContent: TTenantPageContent,
): Promise<ReactNode> => {
  const { tenant } = await resolveTenant();
  return PageContent({ tenant });
};

/**
 * `generateMetadata` for a dashboard/tenant route pair — both variants show
 * the same title, keyed by the shared `pageMetadata` translation bucket.
 */
export const tenantPageMetadata = async (
  titleKey: string,
): Promise<Metadata> => {
  const t = await getTranslations('pageMetadata');
  return { title: t(titleKey) };
};
