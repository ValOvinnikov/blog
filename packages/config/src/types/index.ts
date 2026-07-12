import type { TLocaleIsoCode } from '@blog/config/constants';

export interface IWithDataTestId {
  dataTestId?: string;
}

export interface ILocalizedParams {
  locale: TLocaleIsoCode;
}
