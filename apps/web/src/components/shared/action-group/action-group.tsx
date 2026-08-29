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

const toButtonVariant = (
  variant: TCtaAction['variant'],
  appearance: TCtaAction['appearance'],
): TActionButtonVariant => {
  if (appearance === CTA_ACTION_APPEARANCE.INLINE) return 'link';
  return variant === CTA_ACTION_VARIANT.PRIMARY ? 'primary' : 'ghost';
};

/**
 * ActionGroup — renders a CTA module's authored actions in order (already
 * validated Primary-first by the Studio schema), mapping each item's
 * variant/appearance onto a `Button` variant. Forwards the authored
 * `ariaLabel` through to the rendered link's native `aria-label` — closes
 * #1861.
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
            isOnDark: Boolean(isOnDark) && variant !== 'primary',
          })}
        >
          {action.link.label}
        </LinkButton>
      );
    })}
  </>
);
