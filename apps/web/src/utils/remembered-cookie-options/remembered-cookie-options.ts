import { ONE_YEAR_IN_SECONDS } from '@web/constants/time';

export const REMEMBERED_COOKIE_OPTIONS = {
  path: '/',
  maxAge: ONE_YEAR_IN_SECONDS,
  sameSite: 'lax',
} as const;
