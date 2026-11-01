'use client';

import type { TMaybeUndefined } from '@blog/config';
import { Select } from '@platform/components/shared/select';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TEmailPageItem } from '@platform/utils/email-draft/email-draft';
import type { TEmailItemStatus } from '@platform/utils/email-draft-changes/email-draft-changes';
import { fieldStatusTone } from '@platform/utils/status-tone/status-tone';

import { itemSelectVariants } from './item-select-variants';

type TEmailPageItemOption = {
  value: TEmailPageItem;
  label: string;
  group: TMaybeUndefined<string>;
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
    trigger,
    value,
    valueName,
    valueMeta,
    itemText,
    itemName,
    itemDescription,
    badge,
  } = itemSelectVariants();
  const selectedOption = items.find((option) => option.value === selected);

  return (
    <Select value={selected} onChange={onSelect}>
      <Select.Trigger aria={{ label: label }} className={trigger()}>
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
      </Select.Trigger>
      <Select.Popup>
        {items.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            <span className={itemText()}>
              <Select.ItemText className={itemName()}>
                {option.label}
              </Select.ItemText>
              <span className={itemDescription()}>{option.description}</span>
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
      </Select.Popup>
    </Select>
  );
};
