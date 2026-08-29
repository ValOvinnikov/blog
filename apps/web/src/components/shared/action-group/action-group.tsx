import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { SmartLink } from '@web/components/shared/smart-link';

import { actionGroupVariants } from './action-group-variants';

type TCtaAction = NonNullable<TCtaModule['actions']>[number];
type TActionButtonVariant = 'primary' | 'ghost' | 'link';

export interface IActionGroupProps {
  actions: TCtaAction[];
  /** Reverses non-primary buttons to white — Banner's dark scrim (D15). */
  isOnDark?: boolean;
}

export const toButtonVariant = (
  variant: TCtaAction['variant'],
  appearance: TCtaAction['appearance'],
): TActionButtonVariant => {
  if (appearance === CTA_ACTION_APPEARANCE.INLINE) return 'link';
  return variant === CTA_ACTION_VARIANT.PRIMARY ? 'primary' : 'ghost';
};

export const toIsReversedOnDark = (
  isOnDark: boolean | undefined,
  variant: TActionButtonVariant,
): boolean => Boolean(isOnDark) && variant !== 'primary';

/**
 * ActionGroup — renders a CTA module's authored actions in order (already
 * validated Primary-first by the Studio schema), mapping each item's
 * variant/appearance onto a `Button` variant. Forwards the authored
 * `ariaLabel` through to the rendered link's `aria-label`, so screen readers
 * get a distinguishing accessible name when several actions share generic
 * link text (e.g. two "Learn more" buttons).
 */
export const ActionGroup = ({ actions, isOnDark }: IActionGroupProps) => (
  <>
    {actions.map((action) => {
      const variant = toButtonVariant(action.variant, action.appearance);

      return (
        <LinkButton
          key={action.variant}
          as={SmartLink}
          href={action.link.href}
          target={action.link.target}
          aria-label={action.link.ariaLabel}
          variant={variant}
          className={actionGroupVariants({
            isOnDark: toIsReversedOnDark(isOnDark, variant),
          })}
        >
          {action.link.label}
        </LinkButton>
      );
    })}
  </>
);
