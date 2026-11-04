import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TLookJumpIndexProps } from '@platform/components/features/look/look-jump-index';
import type { TAccordionActions } from '@platform/components/shared/accordion';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import type { TLookRow } from '@platform/constants/look-row';
import { findLookCardContaining } from '@platform/utils/look-anchor/look-anchor';
import {
  LOOK_ROWS,
  nextOpenRows,
  revealOpenRow,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useRef, useState, type RefCallback } from 'react';

type TLookRowActions = TAccordionActions<TLookRow>;

export type TLookRowsGroup = {
  openValues: readonly TLookRow[];
  onOpenValuesChange: (values: TLookRow[]) => void;
  actionsRef: RefCallback<TLookRowActions>;
};

export const useLookOpenRows = () => {
  const [openRows, setOpenRows] = useState<readonly TLookRow[]>([]);
  const [engagedCard, setEngagedCard] =
    useState<TMaybeUndefined<TLookCard>>(undefined);
  const rowActions = useRef(new Map<TLookRow, TLookRowActions>());

  const groupProps = (groupRows: readonly TLookRow[]): TLookRowsGroup => ({
    openValues: openRows.filter((row) => groupRows.includes(row)),
    onOpenValuesChange: (next) => {
      const opened = next.find((row) => !openRows.includes(row));
      if (opened) setEngagedCard(opened);
      setOpenRows((prev) => nextOpenRows(prev, groupRows, next));
    },
    actionsRef: (actions: TMaybeNull<TLookRowActions>) => {
      for (const row of groupRows) {
        if (actions) {
          rowActions.current.set(row, actions);
        } else {
          rowActions.current.delete(row);
        }
      }
    },
  });

  const revealRow = (row: TLookRow) =>
    setOpenRows((prev) => revealOpenRow(prev, row));

  const revealCard = (card: TLookCard) => {
    setEngagedCard(card);
    if (card === LOOK_CARD.PRESET) return;
    rowActions.current.get(card)?.openRow(card, { focus: true });
  };

  const engageCardAt = (target: Node) => {
    const card = findLookCardContaining(target);
    if (card) setEngagedCard(card);
  };

  const isAllOpen = openRows.length === LOOK_ROWS.length;

  const toggleAll = () => {
    setEngagedCard(undefined);
    setOpenRows(isAllOpen ? [] : [...LOOK_ROWS]);
  };

  const isEngagedShown =
    engagedCard === LOOK_CARD.PRESET ||
    openRows.some((row) => row === engagedCard);

  const jumpIndex: TLookJumpIndexProps = {
    openRows,
    editedCard: isEngagedShown ? engagedCard : undefined,
    isAllOpen,
    onSelectCard: revealCard,
    onToggleAll: toggleAll,
  };

  return { groupProps, revealRow, revealCard, engageCardAt, jumpIndex };
};
