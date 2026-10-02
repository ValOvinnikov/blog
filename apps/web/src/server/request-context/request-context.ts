import type { TLocaleIsoCode } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/unresolved-tenant-placeholder';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { cache } from 'react';

type TRouteParams = { tenant: string; locale: string };

type TRequestContextStore = {
  tenant?: { id: string | undefined };
  locale?: TLocaleIsoCode;
};

const getStore = cache((): TRequestContextStore => ({}));

const notEnteredError = () =>
  new Error(
    'The request context was read before enterRequestContext() ran for this request.',
  );

const conflictingEntryError = () =>
  new Error(
    'enterRequestContext() was called twice in one request with different route params.',
  );

/**
 * Must run first in every `[tenant]/[locale]` layout, page and
 * `generateMetadata`. The tenant is stored before the locale is validated so
 * `[tenant]/not-found.tsx` can still theme the 404 an invalid locale throws.
 */
export const enterRequestContext = async (
  params: Promise<TRouteParams>,
): Promise<void> => {
  const { tenant, locale } = await params;
  const store = getStore();

  const tenantId =
    tenant === UNRESOLVED_TENANT_PLACEHOLDER ? undefined : tenant;
  if (store.tenant && store.tenant.id !== tenantId) {
    throw conflictingEntryError();
  }
  store.tenant = { id: tenantId };

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  if (store.locale && store.locale !== locale) {
    throw conflictingEntryError();
  }
  store.locale = locale;
  setRequestLocale(locale);
};

export const getContextTenantId = (): string | undefined => {
  const { tenant } = getStore();
  if (!tenant) throw notEnteredError();
  return tenant.id;
};

export const getContextLocale = (): TLocaleIsoCode => {
  const { locale } = getStore();
  if (!locale) throw notEnteredError();
  return locale;
};

/** For a 404 boundary, which must render even when no route entered the context. */
export const peekContextTenantId = (): string | undefined =>
  getStore().tenant?.id;
