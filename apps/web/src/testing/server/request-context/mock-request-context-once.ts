import {
  getRequestContext,
  type TRequestContext,
} from '@web/server/request-context/request-context';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

export const mockRequestContextOnce = (overrides: Partial<TRequestContext>) =>
  vi
    .mocked(getRequestContext)
    .mockResolvedValueOnce({ ...MOCK_REQUEST_CONTEXT, ...overrides });
