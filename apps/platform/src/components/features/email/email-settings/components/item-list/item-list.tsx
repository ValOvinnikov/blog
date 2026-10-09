import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type {
  TEmailItemStatus,
  TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import { fieldStatusTone } from '@platform/utils/status-tone/status-tone';

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
          <Button
            key={option.value}
            variant="unstyled"
            className={item()}
            aria-current={option.value === selected}
            onClick={() => onSelect(option.value)}
          >
            <span className={label()}>{option.label}</span>
            <span className={description()}>{option.description}</span>
            <StatusBadge tone={fieldStatusTone(option.status)} hasDot={false}>
              {option.statusLabel}
            </StatusBadge>
          </Button>
        ))}
      </nav>
    </Card>
  );
};
