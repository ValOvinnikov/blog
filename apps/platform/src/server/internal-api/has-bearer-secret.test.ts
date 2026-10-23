import { HTTP_METHOD } from '@blog/config/constants';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';

import { hasBearerSecret } from './has-bearer-secret';

const requestWith = (authorization?: string): Request =>
  new Request('https://admin.example.com/api/internal/any', {
    method: HTTP_METHOD.POST,
    headers: authorization ? { authorization } : {},
  });

describe('hasBearerSecret', () => {
  it('accepts the matching Bearer secret', () => {
    expect(
      hasBearerSecret(
        requestWith(`Bearer ${MOCK_BEARER_SECRET}`),
        MOCK_BEARER_SECRET,
      ),
    ).toBe(true);
  });

  it.each([
    ['no Authorization header', undefined],
    ['a different secret of the same length', 'Bearer a-very-secret-valuX'],
    ['a secret of a different length', 'Bearer short'],
    ['the right secret under another scheme', `Basic ${MOCK_BEARER_SECRET}`],
  ])('rejects %s', (_case, authorization) => {
    expect(
      hasBearerSecret(requestWith(authorization), MOCK_BEARER_SECRET),
    ).toBe(false);
  });
});
