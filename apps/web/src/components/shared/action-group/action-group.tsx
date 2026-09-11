import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type ILink,
  type TCtaActionAppearance,
  type TCtaActionVariant,
  type TMaybeUndefined,
} from '@blog/config';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { SmartLink } from '@web/components/shared/smart-link';

import {
  actionGroupHiddenLabelVariants,
  actionGroupVariants,
} from './action-group-variants';

type TActionButtonVariant = 'primary' | 'ghost' | 'link';

export interface IActionGroupAction {
  link: ILink;
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  hiddenLabelSuffix?: TMaybeUndefined<string>;
}

export interface IActionGroupProps {
  actions: readonly IActionGroupAction[];
  /** Reverses non-primary button colors for use on a dark or image background. */
  isOnDark?: boolean;
}

export const toButtonVariant = (
  variant: TCtaActionVariant,
  appearance: TMaybeUndefined<TCtaActionAppearance>,
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
 * item's variant/appearance to a `Button` style, forwarding `ariaLabel` for
 * a distinguishing accessible name, and rendering an optional
 * `hiddenLabelSuffix` as real (sr-only) text inside that accessible name.
 */
export const ActionGroup = ({ actions, isOnDark }: IActionGroupProps) => (
  <>
    {actions.map((action, index) => {
      const variant = toButtonVariant(action.variant, action.appearance);

      return (
        <LinkButton
          key={index}
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
          {action.hiddenLabelSuffix && (
            <span
              className={actionGroupHiddenLabelVariants()}
            >{`: ${action.hiddenLabelSuffix}`}</span>
          )}
        </LinkButton>
      );
    })}
  </>
);
