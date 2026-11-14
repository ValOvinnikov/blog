import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import { promoCodeSchema } from '@platform/server/billing/upgrade-checkout-input';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toServerCookieOptions } from '@platform/utils/server-cookie-options/server-cookie-options';
import { SIGNUP_PROMO_COOKIE } from '@platform/utils/signup-promo-cookie/signup-promo-cookie';
import type { NextRequest, NextResponse } from 'next/server';

// Long enough to sign up, onboard and come back to Upgrade later; Checkout still refuses a code that has expired.
const SIGNUP_PROMO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const rememberSignupPromo = (
  request: NextRequest,
  response: NextResponse,
): void => {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== adminRoutes.signUp()) return;

  const promo = promoCodeSchema.parse(
    searchParams.get(UPGRADE_SEARCH_PARAM.PROMO) ?? undefined,
  );
  if (!promo) return;

  response.cookies.set(
    SIGNUP_PROMO_COOKIE,
    promo,
    toServerCookieOptions(SIGNUP_PROMO_COOKIE_MAX_AGE_SECONDS),
  );
};
