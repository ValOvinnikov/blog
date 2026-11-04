import { lookJumpIndexVariants } from '@platform/components/features/look/look-jump-index/look-jump-index-variants';
import type { TLookGroup } from '@platform/constants/look-group';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';

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
  const { item, groupLink, groupLabel } = lookJumpIndexVariants({ isPhone });

  if (isPhone) {
    return (
      <li aria-hidden="true" className={item({ class: groupLabel() })}>
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
        className={groupLink()}
      >
        {title}
      </a>
    </li>
  );
};
