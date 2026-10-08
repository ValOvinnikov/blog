import { Field } from '@base-ui/react/field';
import type { TEmailPageItemOption } from '@platform/components/features/email/email-settings/components/item-list';
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
  const { root, label: labelSlot, select } = itemSelectVariants();

  return (
    <Field.Root className={root()}>
      <Field.Label className={labelSlot()}>{label}</Field.Label>
      <Field.Control
        render={<select />}
        className={select()}
        value={selected}
        onValueChange={(value) => {
          const next = items.find((option) => option.value === value);
          if (next) onSelect(next.value);
        }}
      >
        {items.map((option) => (
          <option key={option.value} value={option.value}>
            {`${option.label} — ${option.statusLabel}`}
          </option>
        ))}
      </Field.Control>
    </Field.Root>
  );
};
