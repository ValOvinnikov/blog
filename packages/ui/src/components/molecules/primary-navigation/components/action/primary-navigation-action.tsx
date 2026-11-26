import {
  HEADER_ACTION_STYLE,
  type IWithClassName,
  SIZE,
  type THeaderActionPhonePlacement,
  type THeaderActionStyle,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';

import { primaryNavigationActionVariants } from './primary-navigation-action-variants';

export type TPrimaryNavigationAction = {
  label: string;
  href: string;
  target?: '_blank';
  style?: THeaderActionStyle;
  phonePlacement?: THeaderActionPhonePlacement;
};

export type TPrimaryNavigationActionProps = IWithClassName & {
  action: TPrimaryNavigationAction;
  linkAs?: TAnchorElementType;
  isInPanel?: boolean;
};

export const PrimaryNavigationAction = ({
  action,
  linkAs,
  isInPanel = false,
  className,
}: TPrimaryNavigationActionProps) => {
  const { label, href, target, style = HEADER_ACTION_STYLE.FILLED } = action;
  const actionClassName = primaryNavigationActionVariants({
    style,
    isInPanel,
    class: className,
  });

  if (style === HEADER_ACTION_STYLE.PLAIN) {
    return (
      <TextLink
        appearance="nav"
        as={linkAs}
        href={href}
        target={target}
        className={actionClassName}
      >
        {label}
      </TextLink>
    );
  }

  return (
    <LinkButton
      as={linkAs}
      href={href}
      target={target}
      variant={style === HEADER_ACTION_STYLE.OUTLINED ? 'outline' : 'primary'}
      size={SIZE.SM}
      className={actionClassName}
    >
      {label}
    </LinkButton>
  );
};
