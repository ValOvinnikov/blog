import type { TLocaleIsoCode } from '../constants';

export interface IWithDataTestId {
  dataTestId?: string;
}

export interface ILocalizedParams {
  locale: TLocaleIsoCode;
}
