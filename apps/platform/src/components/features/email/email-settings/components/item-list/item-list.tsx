import { Card } from '@platform/components/shared/card';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type {
  TEmailItemStatus,
  TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';

import { itemListVariants } from './item-list-variants';

export type TEmailPageItemOption = {
  value: TEmailPageItem;
  label: string;
  description: string;
  status: TEmailItemStatus;
  statusLabel: string;
};

export type TItemListProps = {
  items: TEmailPageItemOption[];
  selected: TEmailPageItem;
  onSelect: (item: TEmailPageItem) => void;
  ariaLabel: string;
};

const STATUS_TONE = {
  default: 'neutral',
  customised: 'plan',
  unsaved: 'warn',
} as const satisfies Record<TEmailItemStatus, string>;

export const ItemList = ({
  items,
  selected,
  onSelect,
  ariaLabel,
}: TItemListProps) => {
  const { root, list, item, label, description } = itemListVariants();

  return (
    <Card className={root()}>
      <nav aria-label={ariaLabel} className={list()}>
        {items.map((option) => (
          <button
            key={option.value}
            type="button"
            className={item()}
            aria-current={option.value === selected}
            onClick={() => onSelect(option.value)}
          >
            <span className={label()}>{option.label}</span>
            <span className={description()}>{option.description}</span>
            <StatusBadge tone={STATUS_TONE[option.status]}>
              {option.statusLabel}
            </StatusBadge>
          </button>
        ))}
      </nav>
    </Card>
  );
};
