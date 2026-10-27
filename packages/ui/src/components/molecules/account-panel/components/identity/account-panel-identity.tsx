import {
  ACCOUNT_PANEL_STYLE,
  SIZE,
  type TAccountPanelStyle,
} from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';

import { accountPanelIdentityVariants } from './account-panel-identity-variants';

export interface IAccountPanelUser {
  name: string;
  email?: string;
  image?: string;
}

type TAccountPanelIdentityProps = {
  appearance: TAccountPanelStyle;
  user: IAccountPanelUser;
  onImageError?: () => void;
};

/** Who is signed in: the reader's avatar, name and email at the top of an account panel. */
export const AccountPanelIdentity = ({
  appearance,
  user,
  onImageError,
}: TAccountPanelIdentityProps) => {
  const { name, email, image } = user;
  const s = accountPanelIdentityVariants({ appearance });

  return (
    <div className={s.root()}>
      <Avatar
        src={image}
        name={name}
        alt=""
        size={appearance === ACCOUNT_PANEL_STYLE.PROFILE ? SIZE.LG : SIZE.MD}
        onImageError={onImageError}
        className={s.avatar()}
      />
      <div className={s.text()}>
        <p className={s.name()} title={name}>
          {name}
        </p>
        {email && (
          <p className={s.email()} title={email}>
            {email}
          </p>
        )}
      </div>
    </div>
  );
};
