import type { TLookGroup } from '@platform/constants/look-group';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';

import { jumpGroupItemVariants } from './jump-group-item-variants';

export type TJumpGroupItemProps = {
  group: TLookGroup;
  title: string;
  isPhone: boolean;
  onSelect: (group: TLookGroup) => void;
};

export const JumpGroupItem = ({
  group,
  title,
  isPhone,
  onSelect,
}: TJumpGroupItemProps) => {
  const { item, link, label } = jumpGroupItemVariants();

  if (isPhone) {
    return (
      <li aria-hidden="true" className={item({ class: label() })}>
        {title}
      </li>
    );
  }

  return (
    <li className={item()}>
      <a
        href={`#${toLookAnchorId(group)}`}
        onClick={(event) => {
          event.preventDefault();
          onSelect(group);
        }}
        className={link()}
      >
        {title}
      </a>
    </li>
  );
};
