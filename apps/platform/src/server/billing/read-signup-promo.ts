import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { SIGNUP_PROMO_COOKIE } from '@platform/utils/signup-promo-cookie/signup-promo-cookie';
import { cookies } from 'next/headers';

export const readSignupPromo = async (): Promise<TMaybeUndefined<string>> =>
  (await cookies()).get(SIGNUP_PROMO_COOKIE)?.value;
