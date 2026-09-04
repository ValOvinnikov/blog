import type { TLocaleIsoCode } from '@blog/config/constants';

/**
 * A value that may be `undefined` (never `null` — the repo convention).
 * Use for view-model fields that always exist as a property but whose value
 * can be absent, e.g. `heroImageUrl: TMaybeUndefined<string>`. Distinct from
 * property optionality (`field?:`), which means the property itself may be
 * missing.
 *
 * Also valid as a return type for a lookup that may legitimately find
 * nothing, e.g. `Promise<TMaybeUndefined<TPost>>` for a fetch by a
 * user-supplied slug. There it signals an expected absence, not a failure —
 * a failure is still a thrown error that `safeAsync` converts to
 * `{ ok: false }`.
 */
export type TMaybeUndefined<T> = T | undefined;

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

export const FORM_STATUSES = [
  'idle',
  'submitting',
  'success',
  'error',
] as const;

/**
 * Lifecycle status for a controlled form submission — the caller owns the
 * state, the component only reads it to drive its UI.
 */
export type TFormStatus = (typeof FORM_STATUSES)[number];
