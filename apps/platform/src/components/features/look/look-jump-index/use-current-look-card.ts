import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import type { TLookRow } from '@platform/constants/look-row';
import { findTopmostLookCard } from '@platform/utils/look-anchor/look-anchor';
import { useEffect, useState, type RefObject } from 'react';

type TUseCurrentLookCardOptions = {
  navRef: RefObject<TMaybeNull<HTMLElement>>;
  editedCard: TMaybeUndefined<TLookCard>;
  openRows: readonly TLookRow[];
};

const LAYOUT_EVENTS = ['scroll', 'resize', 'transitionend'] as const;

export const useCurrentLookCard = ({
  navRef,
  editedCard,
  openRows,
}: TUseCurrentLookCardOptions): TLookCard => {
  const [topmostCard, setTopmostCard] = useState<TLookCard>(LOOK_CARD.PRESET);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const indexBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      setTopmostCard(findTopmostLookCard(indexBottom));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    for (const type of LAYOUT_EVENTS) {
      window.addEventListener(type, schedule, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      for (const type of LAYOUT_EVENTS) {
        window.removeEventListener(type, schedule);
      }
    };
  }, [navRef, openRows]);

  return editedCard ?? topmostCard;
};
