import {
  getRequestContext,
  type TRequestContext,
} from '@web/server/request-context/request-context';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

export const mockRequestContextForTest = (
  overrides: Partial<TRequestContext>,
) => {
  vi.mocked(getRequestContext).mockResolvedValue({
    ...MOCK_REQUEST_CONTEXT,
    ...overrides,
  });
  onTestFinished(() => {
    vi.mocked(getRequestContext).mockReset();
  });
};
