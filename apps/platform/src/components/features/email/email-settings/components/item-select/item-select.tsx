'use client';

import { Select } from '@base-ui/react/select';
import { ICONS, SIZE } from '@blog/config';
import type { TEmailPageItemOption } from '@platform/components/features/email/email-settings/components/item-list';
import { Icon } from '@platform/components/shared/icon';
import type { TEmailPageItem } from '@platform/utils/email-draft/email-draft';

import { itemSelectVariants } from './item-select-variants';

export type TItemSelectProps = {
  items: TEmailPageItemOption[];
  selected: TEmailPageItem;
  onSelect: (item: TEmailPageItem) => void;
  label: string;
};

export const ItemSelect = ({
  items,
  selected,
  onSelect,
  label,
}: TItemSelectProps) => {
  const {
    root,
    label: labelSlot,
    trigger,
    value,
    icon,
    popup,
    item,
    indicator,
  } = itemSelectVariants();
  const selectItems = items.map((option) => ({
    value: option.value,
    label: `${option.label} — ${option.statusLabel}`,
  }));

  return (
    <div className={root()}>
      <Select.Root
        items={selectItems}
        value={selected}
        onValueChange={(next) => {
          if (next) onSelect(next);
        }}
      >
        <Select.Label className={labelSlot()}>{label}</Select.Label>
        <Select.Trigger className={trigger()}>
          <Select.Value className={value()} />
          <Select.Icon className={icon()}>
            <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={4}>
            <Select.Popup className={popup()}>
              <Select.List>
                {selectItems.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={item()}
                  >
                    <span className={indicator()}>
                      <Select.ItemIndicator>
                        <Icon name={ICONS.CHECK} size={SIZE.SM} />
                      </Select.ItemIndicator>
                    </span>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};
