import type { TLocaleIsoCode } from '@blog/config/constants';

/**
 * A value that may be `undefined` (never `null` — the repo convention).
 * Use for view-model fields that always exist as a property but whose value
 * can be absent, e.g. `heroImageUrl: TMaybeUndefined<string>`. Distinct from
 * property optionality (`field?:`), which means the property itself may be
 * missing.
 */
export type TMaybeUndefined<T> = T | undefined;

export interface IWithDataTestId {
  dataTestId?: string;
}

export interface ILocalizedParams {
  locale: TLocaleIsoCode;
}
