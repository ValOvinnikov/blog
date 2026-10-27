import {
  ACCOUNT_BUTTON_STYLE,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import type { MouseEventHandler, Ref } from 'react';

import {
  accountTriggerVariants,
  type TAccountTriggerVariants,
} from './account-trigger-variants';

export interface IAccountTriggerLabels {
  signIn: string;
  account: string;
}

export interface IAccountTriggerUser {
  name: string;
  image?: string;
}

export type TAccountTriggerProps = IWithClassName &
  IWithDataTestId & {
    appearance: NonNullable<TAccountTriggerVariants['appearance']>;
    labels: IAccountTriggerLabels;
    user?: IAccountTriggerUser;
    onImageError?: () => void;
    isOpen: boolean;
    panelId: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    ref?: Ref<HTMLButtonElement>;
  };

/** The header button that opens the account panel when signed in and the sign-in panel when signed out, holding one footprint across both states. */
export const AccountTrigger = ({
  appearance,
  labels,
  user,
  onImageError,
  isOpen,
  panelId,
  onClick,
  ref,
  className,
  dataTestId,
}: TAccountTriggerProps) => {
  const s = accountTriggerVariants({ appearance });
  const isPill = appearance === ACCOUNT_BUTTON_STYLE.PILL;
  const label = user ? labels.account : labels.signIn;
  const spareLabel = user ? labels.signIn : labels.account;

  const glyph = user ? (
    <Avatar
      src={user.image}
      name={user.name}
      alt=""
      className={s.avatar()}
      onImageError={onImageError}
    />
  ) : (
    <Icon
      name={ICONS.USER}
      size={isPill ? SIZE.SM : SIZE.MD}
      className={s.personIcon()}
    />
  );

  return (
    <IconButton
      ref={ref}
      ariaLabel={label}
      title={isPill ? undefined : label}
      aria-haspopup={user ? 'menu' : 'dialog'}
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onClick}
      dataTestId={dataTestId}
      className={s.root({ class: className })}
    >
      {isPill ? <span className={s.glyph()}>{glyph}</span> : glyph}
      {isPill && (
        <span className={s.labels()}>
          <span className={s.label()}>{label}</span>
          <span aria-hidden="true" className={s.spareLabel()}>
            {spareLabel}
          </span>
        </span>
      )}
    </IconButton>
  );
};
