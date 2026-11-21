import { faker } from '@faker-js/faker';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';
import { MOCK_LOCAL_HOST } from '@web/testing/shared/tenant/fixtures';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

import { isPlatformFallbackHost } from './is-platform-fallback-host';

faker.seed(5724);

vi.mock('@web/utils/env/env');
vi.mock('@web/utils/is-production-environment');

const MOCK_SITE_HOST = faker.internet.domainName();
const LOCALHOST = 'localhost';
const MOCK_UNKNOWN_HOST = `${faker.lorem.slug()}.${MOCK_SITE_HOST}`;

beforeEach(() => {
  vi.mocked(isProductionEnvironment).mockReturnValue(false);
  setMockEnv({ NEXT_PUBLIC_SITE_URL: `https://${MOCK_SITE_HOST}` });
});

describe(isPlatformFallbackHost, () => {
  describe('outside production', () => {
    it.each([LOCALHOST, MOCK_LOCAL_HOST, MOCK_SITE_HOST, null])(
      'allows %j',
      (host) => {
        expect(isPlatformFallbackHost(host)).toBe(true);
      },
    );

    it('refuses any other host', () => {
      expect(isPlatformFallbackHost(MOCK_UNKNOWN_HOST)).toBe(false);
    });

    it('refuses every host but localhost when the site URL is unset', () => {
      setMockEnv({});

      expect(isPlatformFallbackHost(MOCK_SITE_HOST)).toBe(false);
    });
  });

  it.each([LOCALHOST, MOCK_SITE_HOST, null])(
    'refuses %j in production',
    (host) => {
      vi.mocked(isProductionEnvironment).mockReturnValue(true);

      expect(isPlatformFallbackHost(host)).toBe(false);
    },
  );
});
