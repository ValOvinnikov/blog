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
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { useRef, useState, type RefCallback } from 'react';

type TLookRowActions = TAccordionActions<TLookRow>;

export type TLookRowsAccordion = {
  openValues: readonly TLookRow[];
  onOpenValuesChange: (values: TLookRow[]) => void;
  actionsRef: RefCallback<TLookRowActions>;
};

export const useLookOpenRows = () => {
  const [openRows, setOpenRows] = useState<readonly TLookRow[]>([]);
  const [editedRow, setEditedRow] =
    useState<TMaybeUndefined<TLookRow>>(undefined);
  const rowActions = useRef<TMaybeNull<TLookRowActions>>(null);

  const rows: TLookRowsAccordion = {
    openValues: openRows,
    onOpenValuesChange: (next) => {
      const opened = next.find((row) => !openRows.includes(row));
      if (opened) setEditedRow(opened);
      setOpenRows((prev) => nextOpenRows(prev, next));
    },
    actionsRef: (actions: TMaybeNull<TLookRowActions>) => {
      rowActions.current = actions;
    },
  };

  const revealRow = (row: TLookRow) =>
    setOpenRows((prev) => revealOpenRow(prev, row));

  const revealCard = (card: TLookCard) => {
    if (card === LOOK_CARD.PRESET) {
      setEditedRow(undefined);
      return;
    }
    setEditedRow(card);
    rowActions.current?.openRow(card, { focus: true });
  };

  const engageCardAt = (target: Node) => {
    const card = findLookCardContaining(target);
    if (card === LOOK_CARD.PRESET) setEditedRow(undefined);
    else if (openRows.some((row) => row === card)) setEditedRow(card);
  };

  const isAllOpen = openRows.length === LOOK_ROWS.length;

  const toggleAll = () => {
    setEditedRow(undefined);
    setOpenRows(isAllOpen ? [] : [...LOOK_ROWS]);
  };

  const jumpIndex: TLookJumpIndexProps = {
    openRows,
    editedCard: openRows.find((row) => row === editedRow),
    isAllOpen,
    onSelectCard: revealCard,
    onToggleAll: toggleAll,
  };

  return { rows, revealRow, revealCard, engageCardAt, jumpIndex };
};
