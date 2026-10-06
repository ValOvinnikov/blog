import { LOCALE_ISO_CODES } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import type { TRequestContext } from '@web/server/request-context/request-context';

export const DEFAULT_TENANT_ID = 'tenant-1';

export const DEFAULT_TENANT_BASE_URL = 'https://example.com';

export const DEFAULT_TENANT_SANITY_CONTEXT: TTenantSanityContext = {
  projectId: 'default-tenant-project',
  dataset: 'default-tenant-dataset',
  token: 'default-tenant-token',
};

export const DEFAULT_REQUEST_CONTEXT: TRequestContext = {
  tenantId: DEFAULT_TENANT_ID,
  locale: LOCALE_ISO_CODES.EN,
  sanityContext: DEFAULT_TENANT_SANITY_CONTEXT,
  metadataBase: new URL(DEFAULT_TENANT_BASE_URL),
  defaultLocale: LOCALE_ISO_CODES.EN,
  liveLocales: [LOCALE_ISO_CODES.EN],
};
