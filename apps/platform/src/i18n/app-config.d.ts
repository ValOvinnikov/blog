import type { TLocaleIsoCode } from '@blog/config';

declare module 'next-intl' {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- augments next-intl's own interface name
  interface AppConfig {
    Locale: TLocaleIsoCode;
  }
}
