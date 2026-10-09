'use client';

import { Select } from '@base-ui/react/select';
import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type {
  TEmailItemStatus,
  TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import { fieldStatusTone } from '@platform/utils/status-tone/status-tone';

import { itemSelectVariants } from './item-select-variants';

type TEmailPageItemOption = {
  value: TEmailPageItem;
  label: string;
  group: string | undefined;
  description: string;
  status: TEmailItemStatus;
  statusLabel: string;
};

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
    label: labelSlot,
    trigger,
    value,
    valueName,
    valueMeta,
    icon,
    popup,
    item,
    indicator,
    itemText,
    itemName,
    itemDescription,
    badge,
  } = itemSelectVariants();
  const selectedOption = items.find((option) => option.value === selected);

  return (
    <Select.Root
      value={selected}
      onValueChange={(next) => {
        if (next) onSelect(next);
      }}
    >
      <Select.Label className={labelSlot()}>{label}</Select.Label>
      <Select.Trigger className={trigger()}>
        {selectedOption && (
          <span className={value()}>
            <span className={valueName()}>{selectedOption.label}</span>
            <span className={valueMeta()}>
              {[selectedOption.group, selectedOption.statusLabel]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        )}
        <Select.Icon className={icon()}>
          <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} alignItemWithTrigger={false}>
          <Select.Popup className={popup()}>
            <Select.List>
              {items.map((option) => (
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
                  <span className={itemText()}>
                    <Select.ItemText className={itemName()}>
                      {option.label}
                    </Select.ItemText>
                    <span className={itemDescription()}>
                      {option.description}
                    </span>
                  </span>
                  <StatusBadge
                    tone={fieldStatusTone(option.status)}
                    hasDot={false}
                    className={badge()}
                  >
                    {option.statusLabel}
                  </StatusBadge>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};
