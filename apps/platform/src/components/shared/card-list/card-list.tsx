import { Text } from '@platform/components/shared/text';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { cardListVariants } from './card-list-variants';
import { CardListFooter } from './components/footer/card-list-footer';
import { CardListLead } from './components/lead/card-list-lead';
import { CardListPrimary } from './components/primary/card-list-primary';
import { CardListRow } from './components/row/card-list-row';
import { CardListSecondary } from './components/secondary/card-list-secondary';
import { CardListTime } from './components/time/card-list-time';

const CardListParts = {
  Row: CardListRow,
  Lead: CardListLead,
  Primary: CardListPrimary,
  Secondary: CardListSecondary,
  Footer: CardListFooter,
  Time: CardListTime,
} satisfies Record<string, ElementType>;

type TCardListProps<TItem> = {
  items: TItem[];
  emptyMessage: string;
  renderRow: (item: TItem) => ReactNode;
};

const CardListRoot = <TItem,>({
  items,
  emptyMessage,
  renderRow,
}: TCardListProps<TItem>) => {
  const { list } = cardListVariants();

  if (items.length === 0) {
    return <Text variant="supporting">{emptyMessage}</Text>;
  }

  return <div className={list()}>{items.map(renderRow)}</div>;
};

export const CardList: TCompoundComponent<
  typeof CardListRoot,
  typeof CardListParts
> = Object.assign(CardListRoot, CardListParts);
