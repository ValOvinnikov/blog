import type { TPartialByLocale } from '@blog/config/types';

import type { ACTION_OUTCOME, TActionRefusal } from '@blog/config/constants';

export type TReasonValues = Record<string, string | number>;

/** A reason code for one failure, with the values its message's ICU placeholders read. */
export type TReasonedFailure<TReason extends string> = {
  reason: TReason;
  values?: TReasonValues;
};

export type TFieldErrors<
  TField extends string,
  TReason extends string,
> = Partial<Record<TField, TReasonedFailure<TReason>>>;

export type TFieldErrorsByLocale<
  TField extends string,
  TReason extends string,
> = TPartialByLocale<TFieldErrors<TField, TReason>>;

type TRefusalVariant<
  TRefusal extends TActionRefusal,
  TRefusalReason extends string,
> =
  | { outcome: Exclude<TRefusal, typeof ACTION_OUTCOME.REFUSED> }
  | (typeof ACTION_OUTCOME.REFUSED extends TRefusal
      ? {
          outcome: typeof ACTION_OUTCOME.REFUSED;
        } & TReasonedFailure<TRefusalReason>
      : never);

type TResultOf<
  TInvalid,
  TRefusal extends TActionRefusal,
  TRefusalReason extends string,
> =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS }
  | TInvalid
  | TRefusalVariant<TRefusal, TRefusalReason>;

/** What a server action returns: success, its field errors, or one of the refusals it declares. */
export type TActionResult<
  TRefusal extends TActionRefusal,
  TField extends string = never,
  TFieldReason extends string = never,
  TRefusalReason extends string = never,
> = TResultOf<
  [TField] extends [never]
    ? never
    : {
        outcome: typeof ACTION_OUTCOME.INVALID;
        fieldErrors: TFieldErrors<TField, TFieldReason>;
      },
  TRefusal,
  TRefusalReason
>;

/** A `TActionResult` for input entered per language, as the Voice overrides are. */
export type TLocalizedActionResult<
  TRefusal extends TActionRefusal,
  TField extends string,
  TFieldReason extends string,
  TRefusalReason extends string = never,
> = TResultOf<
  {
    outcome: typeof ACTION_OUTCOME.INVALID;
    fieldErrorsByLocale: TFieldErrorsByLocale<TField, TFieldReason>;
  },
  TRefusal,
  TRefusalReason
>;
