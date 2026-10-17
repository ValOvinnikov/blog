import type { ACTION_OUTCOME, TActionRefusal } from '@blog/config/constants';

/** What a server action returns: success, the invalid fields, or one of the refusals it declares. */
export type TActionResult<
  TRefusal extends TActionRefusal,
  TField extends string = never,
> =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS }
  | ([TField] extends [never]
      ? never
      : { outcome: typeof ACTION_OUTCOME.INVALID; invalidFields: TField[] })
  | { outcome: TRefusal };
