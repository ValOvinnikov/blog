import type { TLocaleIsoCode } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { routing } from '@web/i18n/routing';
import { isTenantServable } from '@web/server/tenant/is-tenant-servable';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/unresolved-tenant-placeholder';
import { env } from '@web/utils/env/env';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { cache } from 'react';

export type TRequestContext = {
  tenantId: string | undefined;
  locale: TLocaleIsoCode;
  sanityContext: TTenantSanityContext;
  metadataBase: URL | undefined;
  defaultLocale: TLocaleIsoCode | undefined;
  liveLocales: TLocaleIsoCode[] | undefined;
};

type TRouteParams = { tenant: string; locale: string };

type TRequestContextStore = {
  entry?: { tenantId: string | undefined; locale: TLocaleIsoCode };
  context?: Promise<TRequestContext>;
};

const getStore = cache((): TRequestContextStore => ({}));

// Archived and deprovisioned rows included: credentials and locales never
// filtered on them, and the base URL applies its own servability gate.
const loadTenantRow = async (
  tenantId: string | undefined,
): Promise<TTenant | undefined> =>
  tenantId && isValidTenantId(tenantId)
    ? queries.tenants.getTenantById(tenantId, { includeArchived: true })
    : undefined;

const toSanityContext = (
  tenantId: string | undefined,
  row: TTenant | undefined,
): TTenantSanityContext => {
  if (!tenantId) return getPlatformSanityContext();

  const credentials = row && queries.tenants.toTenantSanityCredentials(row);
  if (credentials) return credentials;

  if (isProductionEnvironment()) {
    notFound();
  }
  return getPlatformSanityContext();
};

const toMetadataBase = (row: TTenant | undefined): URL | undefined => {
  const isServable = row && !row.deprovisionedAt && isTenantServable(row);
  const baseUrl =
    isServable && row.primaryDomain
      ? `https://${row.primaryDomain}`
      : env.NEXT_PUBLIC_SITE_URL;

  return baseUrl ? new URL(baseUrl) : undefined;
};

const buildRequestContext = async (
  tenantId: string | undefined,
  locale: TLocaleIsoCode,
): Promise<TRequestContext> => {
  const row = await loadTenantRow(tenantId);

  return {
    tenantId,
    locale,
    sanityContext: { ...toSanityContext(tenantId, row), locale },
    metadataBase: toMetadataBase(row),
    defaultLocale: row?.locale,
    liveLocales: row && queries.tenants.selectLiveLocales(row),
  };
};

/** Must run first in every `[tenant]/[locale]` layout, page and `generateMetadata`. */
export const enterRequestContext = async (
  params: Promise<TRouteParams>,
): Promise<void> => {
  const { tenant, locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const tenantId =
    tenant === UNRESOLVED_TENANT_PLACEHOLDER ? undefined : tenant;
  const store = getStore();

  if (store.entry) {
    if (store.entry.tenantId !== tenantId || store.entry.locale !== locale) {
      throw new Error(
        'enterRequestContext() was called twice in one request with different route params.',
      );
    }
  } else {
    store.entry = { tenantId, locale };
    store.context = buildRequestContext(tenantId, locale);
  }

  setRequestLocale(locale);
  await store.context;
};

export const getRequestContext = (): Promise<TRequestContext> => {
  const { context } = getStore();
  if (!context) {
    throw new Error(
      'The request context was read before enterRequestContext() ran for this request.',
    );
  }
  return context;
};

/** For a 404 boundary, which must render even when no route entered the context. */
export const peekRequestContext = async (): Promise<
  TRequestContext | undefined
> => getStore().context?.catch(() => undefined);
