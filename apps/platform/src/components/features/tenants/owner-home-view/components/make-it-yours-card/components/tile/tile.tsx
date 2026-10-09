import { SIZE } from '@blog/config';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { Link } from '@platform/i18n/navigation';

import { tileVariants } from './tile-variants';

export type TTileProps = {
  href: string;
  icon: TRegisteredIconName;
  title: string;
  description: string;
};

export const Tile = ({ href, icon, title, description }: TTileProps) => {
  const {
    root,
    icon: iconSlot,
    title: titleSlot,
    description: descriptionSlot,
  } = tileVariants();

  return (
    <Link href={href} className={root()}>
      <Icon name={icon} size={SIZE.LG} className={iconSlot()} />
      <span className={titleSlot()}>{title}</span>
      <span className={descriptionSlot()}>{description}</span>
    </Link>
  );
};
