import type { TMaybeNull } from '@shinefold/config';
import { isNull, isUndefined } from '@shinefold/utils/primitives';
import { env } from '@web/utils/env/env';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

const LOCALHOST = 'localhost';
const PORT_SUFFIX_PATTERN = /:\d+$/;

const isSiteHost = (host: string): boolean => {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  return !isUndefined(siteUrl) && new URL(siteUrl).host === host;
};

export const isPlatformFallbackHost = (host: TMaybeNull<string>): boolean => {
  if (isProductionEnvironment()) return false;
  if (isNull(host)) return true;

  return (
    host.replace(PORT_SUFFIX_PATTERN, '') === LOCALHOST || isSiteHost(host)
  );
};
