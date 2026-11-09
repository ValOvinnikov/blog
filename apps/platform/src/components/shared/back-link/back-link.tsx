import { ICONS, SIZE } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';
import { buttonVariants } from '@platform/components/shared/button/button-variants';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { Link } from '@platform/i18n/navigation';

import { backLinkVariants } from './back-link-variants';

type TBackLinkTarget =
  { href: string; onClick?: never } | { onClick: () => void; href?: never };

export type TBackLinkProps = TBackLinkTarget &
  IWithClassName & {
    children: string;
  };

export const BackLink = ({
  href,
  onClick,
  className,
  children,
}: TBackLinkProps) => {
  const { root, arrow } = backLinkVariants();
  const classes = buttonVariants({
    variant: BUTTON_VARIANT.GHOST,
    size: SIZE.SM,
    focusGround: FOCUS_RING_GROUND.BG,
  }).root({ class: root({ class: className }) });
  const content = (
    <>
      <Icon name={ICONS.ARROW} className={arrow()} />
      {children}
    </>
  );

  if (isUndefined(href)) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
};
