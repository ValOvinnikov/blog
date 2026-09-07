import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type TCtaActionAppearance,
  type TCtaActionVariant,
} from '@blog/config';
import type { TCtaAction, THeroPrimaryAction } from '@blog/service';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { SmartLink } from '@web/components/shared/smart-link';

import {
  actionGroupHiddenLabelVariants,
  actionGroupVariants,
} from './action-group-variants';

export type TActionGroupAction = TCtaAction | THeroPrimaryAction;
type TActionButtonVariant = 'primary' | 'ghost' | 'link';

export interface IActionGroupProps {
  actions: TActionGroupAction[];
  /** Reverses non-primary button colors for use on a dark or image background. */
  isOnDark?: boolean;
}

export const toButtonVariant = (
  variant: TCtaActionVariant,
  appearance: TCtaActionAppearance | undefined,
): TActionButtonVariant => {
  if (appearance === CTA_ACTION_APPEARANCE.INLINE) return 'link';
  return variant === CTA_ACTION_VARIANT.PRIMARY ? 'primary' : 'ghost';
};

export const toIsReversedOnDark = (
  isOnDark: boolean | undefined,
  variant: TActionButtonVariant,
): boolean => Boolean(isOnDark) && variant !== 'primary';

const isCtaAction = (action: TActionGroupAction): action is TCtaAction =>
  'link' in action;

/**
 * Renders a list of link-shaped actions in authored order, mapping each
 * item's variant/appearance to a `Button` style and forwarding its
 * `ariaLabel` through for a distinguishing accessible name. Accepts either a
 * full `module_cta`-style action or the hero's derived primary action — the
 * latter has no authored `variant` (it's always the hero's main action) and
 * carries an optional `hiddenLabelSuffix` instead of an `ariaLabel`.
 */
export const ActionGroup = ({ actions, isOnDark }: IActionGroupProps) => (
  <>
    {actions.map((action, index) => {
      const cta = isCtaAction(action);
      const link = cta ? action.link : action;
      const variant = cta ? action.variant : CTA_ACTION_VARIANT.PRIMARY;
      const hiddenLabelSuffix = cta ? undefined : action.hiddenLabelSuffix;
      const buttonVariant = toButtonVariant(variant, action.appearance);

      return (
        <LinkButton
          key={index}
          as={SmartLink}
          href={link.href}
          target={link.target}
          aria-label={cta ? action.link.ariaLabel : undefined}
          variant={buttonVariant}
          className={actionGroupVariants({
            isOnDark: toIsReversedOnDark(isOnDark, buttonVariant),
          })}
        >
          {link.label}
          {hiddenLabelSuffix && (
            <span
              className={actionGroupHiddenLabelVariants()}
            >{`: ${hiddenLabelSuffix}`}</span>
          )}
        </LinkButton>
      );
    })}
  </>
);
