import { okResult } from '@shinefold/utils';
import { routing } from '@web/i18n/routing';
import type * as TModule from '@web/server/tenant/tenant-live-locales/tenant-live-locales';

export const selectTenantLiveLocales = vi.fn<
  typeof TModule.selectTenantLiveLocales
>(async ({ locale, additionalLocales }) => [locale, ...additionalLocales]);

export const getTenantLiveLocales = vi.fn<typeof TModule.getTenantLiveLocales>(
  async () => [routing.defaultLocale],
);

export const resolveTenantLiveLocales = vi.fn<
  typeof TModule.resolveTenantLiveLocales
>(async () => okResult([routing.defaultLocale]));
