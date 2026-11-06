import {
  MOCK_CLIENT_ID,
  MOCK_MASKED_CLIENT_ID,
} from '@platform/testing/sign-in-apps/fixtures';

import { maskClientId } from './mask-client-id';

describe(maskClientId, () => {
  it('keeps only the first six characters visible', () => {
    expect(maskClientId(MOCK_CLIENT_ID)).toBe(MOCK_MASKED_CLIENT_ID);
  });
});
