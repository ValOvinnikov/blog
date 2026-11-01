import type { TLocaleIsoCode, TSortDirection } from '@blog/config/constants';

export * from './action-result';
export * from './contrast-result';
export * from './magic-link-send-refusal';
export * from './outcome';
export * from './page-module';

export type TMaybeUndefined<T> = T | undefined;

export type TMaybeNull<T> = T | null;

export type TNullable<T> = T | null | undefined;

/** A row that may have been through `JSON.stringify` and back, so each `Date` field may arrive as its ISO string. */
export type TMaybeJsonDates<T> = {
  [K in keyof T]: T[K] extends Date
    ? Date | string
    : T[K] extends TMaybeNull<Date>
      ? TMaybeNull<Date | string>
      : T[K];
};

export type TByLocale<V> = Record<TLocaleIsoCode, V>;

export type TPartialByLocale<V> = Partial<TByLocale<V>>;

export type TColumnSort<TColumn> = {
  column: TColumn;
  direction: TSortDirection;
};

export interface IWithDataTestId {
  dataTestId?: string;
}

/**
 * `className` carries layout concerns the parent controls — margins, width,
 * flex/grid placement — never appearance, which belongs to the component's
 * own variants.
 */
export interface IWithClassName {
  className?: string;
}

export type TControlAria = {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
};

export type TNamedControlAria = TControlAria &
  ({ label: string } | { labelledBy: string });

export interface ILocalizedParams {
  locale: TLocaleIsoCode;
}

export interface ITenantLocalizedParams extends ILocalizedParams {
  tenant: string;
}

export interface ITenantLocalizedSlugParams extends ITenantLocalizedParams {
  slug: string;
}

export interface ITenantIdParams {
  tenantId: string;
}
