import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type ILink,
  type TCtaActionAppearance,
  type TCtaActionVariant,
  type TMaybeUndefined,
} from '@shinefold/config';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import { SmartLink } from '@web/components/shared/smart-link';

import {
  actionGroupHiddenLabelVariants,
  actionGroupVariants,
} from './action-group-variants';

type TActionButtonVariant = 'primary' | 'ghost' | 'link';

interface IActionGroupAction {
  link: ILink;
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  hiddenLabelSuffix?: TMaybeUndefined<string>;
}

export interface IActionGroupProps {
  actions: readonly IActionGroupAction[];
}

const toButtonVariant = (
  variant: TCtaActionVariant,
  appearance: TMaybeUndefined<TCtaActionAppearance>,
): TActionButtonVariant => {
  if (appearance === CTA_ACTION_APPEARANCE.INLINE) return 'link';
  return variant === CTA_ACTION_VARIANT.PRIMARY ? 'primary' : 'ghost';
};

export const ActionGroup = ({ actions }: IActionGroupProps) => (
  <>
    {actions.map((action, index) => {
      const variant = toButtonVariant(action.variant, action.appearance);

      return (
        <LinkButton
          key={index}
          as={SmartLink}
          href={action.link.href}
          target={action.link.target}
          variant={variant}
          className={actionGroupVariants({ isInline: variant === 'link' })}
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
