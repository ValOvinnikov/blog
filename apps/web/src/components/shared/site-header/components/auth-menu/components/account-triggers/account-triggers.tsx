'use client';

import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type IAccountControl,
  type IWithClassName,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import { AccountTrigger } from '@blog/ui/components/molecules/account-trigger';
import type { IReaderAccountUser } from '@web/components/shared/reader-account-panel';
import type { TUsePopoverResult } from '@web/hooks/use-popover';
import { useTranslations } from 'next-intl';
import type { MouseEvent, RefObject } from 'react';

import { accountTriggersVariants } from './account-triggers-variants';

export type TAccountTriggersProps = IWithClassName & {
  accountControl: Pick<IAccountControl, 'buttonStyle' | 'phonePlacement'>;
  user: TMaybeUndefined<IReaderAccountUser>;
  onImageError?: () => void;
  popover: Pick<TUsePopoverResult, 'open' | 'panelId'> &
    Partial<Pick<TUsePopoverResult, 'triggerRef' | 'toggle'>>;
};

export const AccountTriggers = ({
  accountControl,
  user,
  onImageError,
  popover,
  className,
}: TAccountTriggersProps) => {
  const t = useTranslations('authMenu');
  const { buttonStyle, phonePlacement } = accountControl;
  const { open, panelId, triggerRef, toggle } = popover;
  const isInPhoneBar = phonePlacement === ACCOUNT_PHONE_PLACEMENT.BAR;
  const hasPhoneCircle =
    isInPhoneBar && buttonStyle === ACCOUNT_BUTTON_STYLE.PILL;
  const { wide, phone } = accountTriggersVariants({
    isWideOnly: !isInPhoneBar || hasPhoneCircle,
  });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (triggerRef) {
      triggerRef.current = event.currentTarget;
    }
    toggle?.();
  };

  const renderTrigger = (
    appearance: IAccountControl['buttonStyle'],
    triggerClassName: string,
    ref?: RefObject<TMaybeNull<HTMLButtonElement>>,
  ) => (
    <AccountTrigger
      ref={ref}
      appearance={appearance}
      labels={{ signIn: t('signIn'), account: t('accountHeading') }}
      user={user}
      onImageError={onImageError}
      isOpen={open}
      panelId={panelId}
      onClick={handleClick}
      className={triggerClassName}
    />
  );

  return (
    <>
      {renderTrigger(buttonStyle, wide({ class: className }), triggerRef)}
      {hasPhoneCircle &&
        renderTrigger(ACCOUNT_BUTTON_STYLE.CIRCLE, phone({ class: className }))}
    </>
  );
};
