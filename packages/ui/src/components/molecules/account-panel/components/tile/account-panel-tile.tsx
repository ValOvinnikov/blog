import { SIZE, type TIconName } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { useId } from 'react';

import { accountPanelTileVariants } from './account-panel-tile-variants';

type TAccountPanelTileProps = {
  href: string;
  label: string;
  description: string;
  icon: TIconName;
  linkAs: TAnchorElementType;
};

/** One destination of the account hub, a tile that says what the page behind it holds. */
export const AccountPanelTile = ({
  href,
  label,
  description,
  icon,
  linkAs,
}: TAccountPanelTileProps) => {
  const descriptionId = useId();
  const s = accountPanelTileVariants();

  return (
    <PopoverMenu.Item
      as={linkAs}
      href={href}
      variant="tile"
      aria-describedby={descriptionId}
      icon={<Icon name={icon} size={SIZE.MD} className={s.icon()} />}
    >
      <span className={s.title()}>{label}</span>
      <span id={descriptionId} aria-hidden="true" className={s.description()}>
        {description}
      </span>
    </PopoverMenu.Item>
  );
};
