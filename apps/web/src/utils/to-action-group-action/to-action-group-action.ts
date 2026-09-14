import type { TCtaAction } from '@blog/service';
import type { IActionGroupAction } from '@web/components/shared/action-group';

/**
 * Suffixes an authored `TCtaAction`'s accessible name with module context
 * (typically the surrounding heading) — every `shared_link` is reusable, so
 * the same visible label (e.g. "Learn more") can legitimately point
 * elsewhere from a different module on the same page.
 */
export const toActionGroupAction = (
  action: TCtaAction,
  hiddenLabelSuffix: string,
): IActionGroupAction => ({
  ...action,
  hiddenLabelSuffix,
});
