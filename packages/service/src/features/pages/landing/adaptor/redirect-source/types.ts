import type { TLocaleIsoCode } from '@shinefold/config/constants';

export type TLandingRedirectSource = {
  source: string;
  language: TLocaleIsoCode;
  isPrefix: boolean;
};
