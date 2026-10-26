import type { TLocaleIsoCode } from '@blog/config/constants';

export * from './action-result';
export * from './contrast-result';
export * from './magic-link-send-refusal';
export * from './outcome';
export * from './page-module';

export type TMaybeUndefined<T> = T | undefined;

export type TMaybeNull<T> = T | null;

export type TNullable<T> = T | null | undefined;

export type TByLocale<V> = Record<TLocaleIsoCode, V>;

export type TPartialByLocale<V> = Partial<TByLocale<V>>;

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
