import { ICONS, SIZE } from '@blog/config';
import { buttonVariants } from '@platform/components/shared/button/button-variants';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { Link } from '@platform/i18n/navigation';

import { backLinkVariants } from './back-link-variants';

export type TBackLinkProps = {
  href: string;
  children: string;
};

export const BackLink = ({ href, children }: TBackLinkProps) => {
  const { root, arrow } = backLinkVariants();

  return (
    <Link
      href={href}
      className={buttonVariants({
        variant: BUTTON_VARIANT.GHOST,
        size: SIZE.SM,
        focusGround: FOCUS_RING_GROUND.BG,
      }).root({ class: root() })}
    >
      <Icon name={ICONS.ARROW} className={arrow()} />
      {children}
    </Link>
  );
};
