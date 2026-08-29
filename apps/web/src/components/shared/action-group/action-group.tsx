import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import type { TCtaModule } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { SmartLink } from '@web/components/shared/smart-link';

import { actionGroupVariants } from './action-group-variants';

type TCtaAction = NonNullable<TCtaModule['actions']>[number];
type TActionButtonVariant = 'primary' | 'ghost' | 'link';

export interface IActionGroupProps {
  actions: TCtaAction[];
  /** Reverses non-primary button colors for use on a dark or image background. */
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
 * Renders a list of link-shaped actions in authored order, mapping each
 * item's variant/appearance to a `Button` style and forwarding its
 * `ariaLabel` through for a distinguishing accessible name.
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
