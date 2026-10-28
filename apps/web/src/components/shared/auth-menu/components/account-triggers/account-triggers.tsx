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
import type { IReaderAccountUser } from '@web/components/shared/auth-menu/components/reader-account-panel/reader-account-panel';
import { useTranslations } from 'next-intl';
import type { MouseEvent, RefObject } from 'react';

import { accountTriggersVariants } from './account-triggers-variants';

export type TAccountTriggersProps = IWithClassName & {
  accountControl: Pick<IAccountControl, 'buttonStyle' | 'phonePlacement'>;
  user: TMaybeUndefined<IReaderAccountUser>;
  onImageError?: () => void;
  isOpen: boolean;
  panelId: string;
  triggerRef?: RefObject<TMaybeNull<HTMLButtonElement>>;
  onToggle?: () => void;
};

export const AccountTriggers = ({
  accountControl,
  user,
  onImageError,
  isOpen,
  panelId,
  triggerRef,
  onToggle,
  className,
}: TAccountTriggersProps) => {
  const t = useTranslations('authMenu');
  const { buttonStyle, phonePlacement } = accountControl;
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
    onToggle?.();
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
      isOpen={isOpen}
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
