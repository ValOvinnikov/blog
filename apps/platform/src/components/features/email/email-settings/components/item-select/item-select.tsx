import type { TEmailPageItemOption } from '@platform/components/features/email/email-settings/components/item-list';
import type { TEmailPageItem } from '@platform/utils/email-draft/email-draft';
import { useId } from 'react';

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
  const selectId = useId();
  const { root, label: labelSlot, select } = itemSelectVariants();

  return (
    <div className={root()}>
      <label htmlFor={selectId} className={labelSlot()}>
        {label}
      </label>
      <select
        id={selectId}
        className={select()}
        value={selected}
        onChange={(event) => {
          const next = items.find(
            (option) => option.value === event.target.value,
          );
          if (next) onSelect(next.value);
        }}
      >
        {items.map((option) => (
          <option key={option.value} value={option.value}>
            {`${option.label} — ${option.statusLabel}`}
          </option>
        ))}
      </select>
    </div>
  );
};
