import type { TMaybeUndefined } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import type { TLookCard } from '@platform/constants/look-card';
import {
  LOOK_INDEX_FADE_END_TEST_ID,
  LOOK_INDEX_FADE_START_TEST_ID,
} from '@platform/constants/look-form';
import type { TLookRow } from '@platform/constants/look-row';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { scrollToLookAnchor } from '@platform/utils/look-anchor/look-anchor';
import { LOOK_CARDS } from '@platform/utils/look-open-rows/look-open-rows';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { JumpCardLink } from './components/jump-card-link';
import { JumpGroupItem } from './components/jump-group-item';
import { LOOK_INDEX_ENTRIES } from './look-index-entries';
import {
  LOOK_INDEX_FADE_WIDTH_PX,
  lookJumpIndexVariants,
} from './look-jump-index-variants';
import { useCurrentLookCard } from './use-current-look-card';

export type TLookJumpIndexProps = {
  openRows: readonly TLookRow[];
  editedCard: TMaybeUndefined<TLookCard>;
  isAllOpen: boolean;
  onSelectCard: (card: TLookCard) => void;
  onToggleAll: () => void;
};

export const LookJumpIndex = ({
  openRows,
  editedCard,
  isAllOpen,
  onSelectCard,
  onToggleAll,
}: TLookJumpIndexProps) => {
  const t = useTranslations('lookForm');
  const isPhone = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const navRef = useRef<HTMLElement>(null);
  const current = useCurrentLookCard({ navRef, editedCard, openRows });
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLUListElement, HTMLAnchorElement>({
      selectedIndex: LOOK_CARDS.indexOf(current),
      fadeWidth: LOOK_INDEX_FADE_WIDTH_PX,
    });
  const styles = lookJumpIndexVariants({ isPhone });

  const selectCard = (card: TLookCard) => {
    onSelectCard(card);
    scrollToLookAnchor(card);
  };

  return (
    <nav
      ref={navRef}
      aria-label={t('jumpIndexAriaLabel')}
      className={styles.root()}
    >
      <div className={styles.bar()}>
        <div className={styles.scroller()}>
          <ul
            ref={trackRef}
            role="list"
            onScroll={onScroll}
            className={styles.list()}
          >
            {LOOK_INDEX_ENTRIES.map((entry) =>
              'card' in entry ? (
                <JumpCardLink
                  key={entry.card}
                  ref={setItemRef(LOOK_CARDS.indexOf(entry.card))}
                  card={entry.card}
                  isCurrent={entry.card === current}
                  isPhone={isPhone}
                  onSelect={selectCard}
                />
              ) : (
                <JumpGroupItem
                  key={entry.group}
                  group={entry.group}
                  title={t(entry.titleKey)}
                  isPhone={isPhone}
                  onSelect={scrollToLookAnchor}
                />
              ),
            )}
          </ul>
          {hasMoreStart && (
            <span
              aria-hidden="true"
              data-testid={LOOK_INDEX_FADE_START_TEST_ID}
              className={styles.fade({ class: styles.fadeStart() })}
            />
          )}
          {hasMoreEnd && (
            <span
              aria-hidden="true"
              data-testid={LOOK_INDEX_FADE_END_TEST_ID}
              className={styles.fade({ class: styles.fadeEnd() })}
            />
          )}
        </div>
        {!isPhone && (
          <>
            <span aria-hidden="true" className={styles.divider()} />
            <Button
              variant={BUTTON_VARIANT.GHOST}
              focusGround={FOCUS_RING_GROUND.SURFACE}
              onClick={onToggleAll}
              className={styles.toggle()}
            >
              {isAllOpen ? t('collapseAll') : t('expandAll')}
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};
