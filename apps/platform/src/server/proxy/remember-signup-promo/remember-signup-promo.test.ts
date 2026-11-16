import { faker } from '@faker-js/faker';
import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import { MOCK_STRIPE_PROMOTION_CODE } from '@platform/testing/billing/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { SIGNUP_PROMO_COOKIE } from '@platform/utils/signup-promo-cookie/signup-promo-cookie';
import { isUndefined } from '@shinefold/utils/primitives';
import { NextRequest, NextResponse } from 'next/server';

import { rememberSignupPromo } from './remember-signup-promo';

faker.seed(6882);

const MOCK_ORIGIN = faker.internet.url({ appendSlash: false });
const MOCK_OVERLONG_PROMO = faker.string.alphanumeric(65);

const remember = (path: string, promo?: string) => {
  const url = new URL(path, MOCK_ORIGIN);
  if (!isUndefined(promo)) {
    url.searchParams.set(UPGRADE_SEARCH_PARAM.PROMO, promo);
  }
  const response = NextResponse.next();

  rememberSignupPromo(new NextRequest(url), response);

  return response.cookies.get(SIGNUP_PROMO_COOKIE);
};

describe(rememberSignupPromo, () => {
  it("remembers the signup page's promo code in an httpOnly cookie", () => {
    const cookie = remember(adminRoutes.signUp(), MOCK_STRIPE_PROMOTION_CODE);

    expect(cookie?.value).toBe(MOCK_STRIPE_PROMOTION_CODE);
    expect(cookie?.httpOnly).toBe(true);
  });

  it('trims the code before remembering it', () => {
    const cookie = remember(
      adminRoutes.signUp(),
      ` ${MOCK_STRIPE_PROMOTION_CODE} `,
    );

    expect(cookie?.value).toBe(MOCK_STRIPE_PROMOTION_CODE);
  });

  it('remembers nothing without a promo code', () => {
    expect(remember(adminRoutes.signUp())).toBeUndefined();
  });

  it.each([' ', MOCK_OVERLONG_PROMO])(
    'remembers nothing for the malformed code %s',
    (promo) => {
      expect(remember(adminRoutes.signUp(), promo)).toBeUndefined();
    },
  );

  it('remembers nothing outside the signup page', () => {
    expect(
      remember(adminRoutes.dashboardUpgrade(), MOCK_STRIPE_PROMOTION_CODE),
    ).toBeUndefined();
  });
});
