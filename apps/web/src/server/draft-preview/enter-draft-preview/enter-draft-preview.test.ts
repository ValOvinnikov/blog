import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { enterDraftPreview } from './enter-draft-preview';

vi.mock('@web/server/request-context/request-context');

const MOCK_PARAMS = Promise.resolve({
  tenant: MOCK_REQUEST_CONTEXT.tenantId ?? '',
  locale: MOCK_REQUEST_CONTEXT.locale,
});

describe(enterDraftPreview, () => {
  it('enters a request the proxy routed as a draft preview', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      isDraftPreview: true,
    });

    await expect(enterDraftPreview(MOCK_PARAMS)).resolves.toBeUndefined();
  });

  it('throws a 404 for a request that is not a draft preview', async () => {
    await expect(enterDraftPreview(MOCK_PARAMS)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });
});
