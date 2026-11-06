import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import type { TLookRow } from '@platform/constants/look-row';
import { findTopmostLookCard } from '@platform/utils/look-anchor/look-anchor';
import { useLayoutMeasure } from '@platform/utils/use-layout-measure/use-layout-measure';
import { useState, type RefObject } from 'react';

type TUseCurrentLookCardOptions = {
  navRef: RefObject<TMaybeNull<HTMLElement>>;
  editedCard: TMaybeUndefined<TLookCard>;
  openRows: readonly TLookRow[];
};

export const useCurrentLookCard = ({
  navRef,
  editedCard,
  openRows,
}: TUseCurrentLookCardOptions): TLookCard => {
  const [topmostCard, setTopmostCard] = useState<TLookCard>(LOOK_CARD.PRESET);

  useLayoutMeasure(() => {
    const indexBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
    setTopmostCard(findTopmostLookCard(indexBottom));
  }, openRows);

  return editedCard ?? topmostCard;
};
