import type * as TModule from '@web/server/request-context/request-context';
import {
  MOCK_NOT_FOUND_CONTEXT,
  MOCK_REQUEST_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

export const enterRequestContext = vi.fn<typeof TModule.enterRequestContext>(
  async () => {},
);

export const getRequestContext = vi.fn<typeof TModule.getRequestContext>(
  async () => MOCK_REQUEST_CONTEXT,
);

export const getNotFoundContext = vi.fn<typeof TModule.getNotFoundContext>(
  async () => MOCK_NOT_FOUND_CONTEXT,
);

export const peekVoiceTenant = vi.fn<typeof TModule.peekVoiceTenant>(
  async () => undefined,
);
