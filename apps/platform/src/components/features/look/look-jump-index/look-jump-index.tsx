import type { TMaybeUndefined } from '@blog/config';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_GROUP } from '@platform/constants/look-group';
import type { TLookRow } from '@platform/constants/look-row';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { scrollToLookAnchor } from '@platform/utils/look-anchor/look-anchor';
import {
  LOOK_CARDS,
  SITE_PARTS_ROWS,
  STYLE_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { useTranslations } from 'next-intl';
import { Fragment, useRef } from 'react';

import { JumpCardLink } from './components/jump-card-link';
import { JumpGroupItem } from './components/jump-group-item';
import {
  LOOK_INDEX_FADE_WIDTH_PX,
  lookJumpIndexVariants,
} from './look-jump-index-variants';
import { useCurrentLookCard } from './use-current-look-card';

const SECTIONS = [
  { group: LOOK_GROUP.STYLE, titleKey: 'styleGroupHeading', rows: STYLE_ROWS },
  {
    group: LOOK_GROUP.SITE_PARTS,
    titleKey: 'sitePartsGroupHeading',
    rows: SITE_PARTS_ROWS,
  },
] as const;

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
  const { hasCardChanges } = useLookForm();
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

  const cardItem = (card: TLookCard) => (
    <li key={card} className={styles.item()}>
      <JumpCardLink
        ref={setItemRef(LOOK_CARDS.indexOf(card))}
        card={card}
        label={
          card === LOOK_CARD.PRESET
            ? t('presetLabel')
            : t(LOOK_ROW_TITLE_KEY[card])
        }
        isCurrent={card === current}
        isDirty={hasCardChanges(card)}
        isPhone={isPhone}
        onSelect={selectCard}
      />
    </li>
  );

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
            {cardItem(LOOK_CARD.PRESET)}
            {SECTIONS.map(({ group, titleKey, rows }) => (
              <Fragment key={group}>
                {!isPhone && (
                  <li aria-hidden="true" className={styles.divider()} />
                )}
                <JumpGroupItem
                  group={group}
                  title={t(titleKey)}
                  isPhone={isPhone}
                  onSelect={scrollToLookAnchor}
                />
                {rows.map(cardItem)}
              </Fragment>
            ))}
          </ul>
          {hasMoreStart && (
            <span
              aria-hidden="true"
              className={styles.fade({ class: styles.fadeStart() })}
            />
          )}
          {hasMoreEnd && (
            <span
              aria-hidden="true"
              className={styles.fade({ class: styles.fadeEnd() })}
            />
          )}
        </div>
        {!isPhone && (
          <>
            <span aria-hidden="true" className={styles.toggleDivider()} />
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
