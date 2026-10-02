import { LOCALE_ISO_CODES } from '@blog/config';
import type * as TModule from '@web/server/request-context/request-context';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const enterRequestContext = vi.fn<typeof TModule.enterRequestContext>(
  async () => {},
);

export const getContextTenantId = vi.fn<typeof TModule.getContextTenantId>(
  () => DEFAULT_TENANT_ID,
);

export const getContextLocale = vi.fn<typeof TModule.getContextLocale>(
  () => LOCALE_ISO_CODES.EN,
);

export const peekContextTenantId = vi.fn<typeof TModule.peekContextTenantId>(
  () => DEFAULT_TENANT_ID,
);
