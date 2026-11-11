import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantSanityContext } from '@blog/service';
import { REQUEST_CONTEXT_LOG } from '@web/constants/request-context';
import { routing } from '@web/i18n/routing';
import { resolveRequestSanityContext } from '@web/server/request-context/request-sanity-context/request-sanity-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { isOperatorSuspended } from '@web/server/tenant/operator-suspension/operator-suspension';
import { isTenantServable } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { isValidTenantId } from '@web/utils/is-tenant-shaped-path-segment';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { cache } from 'react';

export type TRequestContext = {
  tenantId: TMaybeUndefined<string>;
  tenantName: TMaybeUndefined<string>;
  locale: TLocaleIsoCode;
  sanityContext: TTenantSanityContext;
  metadataBase: TMaybeUndefined<URL>;
  defaultLocale: TMaybeUndefined<TLocaleIsoCode>;
  liveLocales: TMaybeUndefined<TLocaleIsoCode[]>;
  isOperatorSuspended: boolean;
  isDraftPreview: boolean;
};

export type TNotFoundContext = {
  tenantId: TMaybeUndefined<string>;
  locale: TLocaleIsoCode;
};

type TRouteParams = { tenant: string; locale: string };

type TRequestedRoute = { tenantId: TMaybeUndefined<string>; locale: string };

type TRequestContextStore = {
  requestedRoute: Promise<TRequestedRoute>;
  recordRequestedRoute: (route: TRequestedRoute) => void;
  tenantRow?: Promise<TMaybeUndefined<TTenant>>;
  entry?: { tenantId: TMaybeUndefined<string>; locale: TLocaleIsoCode };
  context?: Promise<TRequestContext>;
  notFoundContext?: Promise<TNotFoundContext>;
};

const getStore = cache((): TRequestContextStore => {
  let recordRequestedRoute: (route: TRequestedRoute) => void = () => {};
  const requestedRoute = new Promise<TRequestedRoute>((resolve) => {
    recordRequestedRoute = resolve;
  });

  return { requestedRoute, recordRequestedRoute };
});

// Archived and deprovisioned rows included: credentials and locales never
// filtered on them, and the base URL applies its own servability gate.
const loadTenantRow = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TTenant>> =>
  tenantId && isValidTenantId(tenantId)
    ? queries.tenants.getTenantById(tenantId, { includeArchived: true })
    : undefined;

const loadTenantRowOnce = (
  store: TRequestContextStore,
  tenantId: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TTenant>> =>
  (store.tenantRow ??= loadTenantRow(tenantId));

const toMetadataBase = (
  row: TMaybeUndefined<TTenant>,
): TMaybeUndefined<URL> => {
  const isServable = row && !row.deprovisionedAt && isTenantServable(row);
  const baseUrl = toTenantBaseUrl(isServable ? row : undefined);

  return baseUrl ? new URL(baseUrl) : undefined;
};

const buildRequestContext = async (
  store: TRequestContextStore,
  tenantId: TMaybeUndefined<string>,
  locale: TLocaleIsoCode,
): Promise<TRequestContext> => {
  const row = await loadTenantRowOnce(store, tenantId);
  const sanityContext = await resolveRequestSanityContext(tenantId, row);

  return {
    tenantId,
    tenantName: row?.name,
    locale,
    sanityContext: { ...sanityContext, locale },
    metadataBase: toMetadataBase(row),
    defaultLocale: row?.locale,
    liveLocales: row && queries.tenants.selectLiveLocales(row),
    isOperatorSuspended: Boolean(row && isOperatorSuspended(row)),
    isDraftPreview: sanityContext.perspective === SANITY_PERSPECTIVE.DRAFTS,
  };
};

/** Must run first in every `[tenant]/[locale]` layout, page and `generateMetadata`. */
export const enterRequestContext = async (
  params: Promise<TRouteParams>,
): Promise<void> => {
  const { tenant, locale } = await params;
  const tenantId =
    tenant === UNRESOLVED_TENANT_PLACEHOLDER ? undefined : tenant;
  const store = getStore();
  store.recordRequestedRoute({ tenantId, locale });

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  if (store.entry) {
    if (store.entry.tenantId !== tenantId || store.entry.locale !== locale) {
      throw new Error(
        'enterRequestContext() was called twice in one request with different route params.',
      );
    }
  } else {
    store.entry = { tenantId, locale };
    store.context = buildRequestContext(store, tenantId, locale);
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

const loadTenantRowForNotFound = async (
  store: TRequestContextStore,
  tenantId: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TTenant>> => {
  try {
    return await loadTenantRowOnce(store, tenantId);
  } catch (error) {
    logger.error(REQUEST_CONTEXT_LOG.NOT_FOUND_TENANT_LOAD_FAILED, { error });
    return undefined;
  }
};

const buildNotFoundContext = async (
  store: TRequestContextStore,
): Promise<TNotFoundContext> => {
  const { tenantId, locale } = await store.requestedRoute;
  const row = await loadTenantRowForNotFound(store, tenantId);
  const defaultLocale = row?.locale ?? routing.defaultLocale;
  const liveLocales = row
    ? queries.tenants.selectLiveLocales(row)
    : routing.locales;
  const servedLocale = hasLocale(liveLocales, locale) ? locale : defaultLocale;

  return { tenantId, locale: servedLocale };
};

/**
 * Next renders both `not-found.tsx` boundaries alongside the
 * `[tenant]/[locale]` layout on every request, so this waits for that layout
 * to enter the route rather than reading the store before it has.
 */
export const getNotFoundContext = (): Promise<TNotFoundContext> => {
  const store = getStore();
  return (store.notFoundContext ??= buildNotFoundContext(store));
};

/**
 * The tenant whose Voice overrides apply in this request, or `undefined`
 * without waiting when no `[tenant]` route has entered — so
 * `global-not-found` and `global-error` never block on it.
 */
export const peekVoiceTenant = async (): Promise<TMaybeUndefined<string>> => {
  const { context, notFoundContext } = getStore();
  const entered = await context?.then(
    (resolved) => resolved,
    () => undefined,
  );

  if (entered) return entered.tenantId;
  return (await notFoundContext)?.tenantId;
};
