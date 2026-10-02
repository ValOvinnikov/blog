import { LOCALE_ISO_CODES } from '@blog/config';
import type * as TModule from '@web/server/request-context/context-tenant';
import {
  DEFAULT_TENANT_BASE_URL,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

export const getContextSanityContext = vi.fn<
  typeof TModule.getContextSanityContext
>(async () => DEFAULT_TENANT_SANITY_CONTEXT);

export const getContextBaseUrl = vi.fn<typeof TModule.getContextBaseUrl>(
  async () => DEFAULT_TENANT_BASE_URL,
);

export const getContextTenantLocales = vi.fn<
  typeof TModule.getContextTenantLocales
>(async () => ({
  defaultLocale: LOCALE_ISO_CODES.EN,
  liveLocales: [LOCALE_ISO_CODES.EN],
}));

export const isContextCapabilityEnabled = vi.fn<
  typeof TModule.isContextCapabilityEnabled
>(async () => true);
