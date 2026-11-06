'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import {
  VOICE_SECTION_BAR_FADE_END_TEST_ID,
  VOICE_SECTION_BAR_FADE_START_TEST_ID,
  VOICE_SECTION_ID,
  type TVoiceSection,
} from '@platform/constants/voice';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { VOICE_SECTIONS_IN_PAGE_ORDER } from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { VoiceSectionChip } from './components/voice-section-chip';
import { useActiveVoiceSection } from './use-active-voice-section';
import { useIsSectionBarPinned } from './use-is-section-bar-pinned';
import { useVoiceSectionBarHeight } from './use-voice-section-bar-height';
import {
  VOICE_SECTION_BAR_FADE_WIDTH_PX,
  voiceSectionBarVariants,
} from './voice-section-bar-variants';

export type TVoiceSectionBarProps = {
  openSections: readonly TVoiceSection[];
  onJumpToSection: (section: TVoiceSection) => void;
  onSetAllSectionsOpen: (isOpen: boolean) => void;
};

const SECTION_BODY_IDS = joinIds(
  ...VOICE_SECTIONS_IN_PAGE_ORDER.map(
    (section) => VOICE_SECTION_ID[section].body,
  ),
);

export const VoiceSectionBar = ({
  openSections,
  onJumpToSection,
  onSetAllSectionsOpen,
}: TVoiceSectionBarProps) => {
  const t = useTranslations('voiceSettings');
  const barRef = useRef<HTMLElement>(null);
  useVoiceSectionBarHeight(barRef);
  const isPinned = useIsSectionBarPinned(barRef);
  const { activeSection, holdActiveSection } = useActiveVoiceSection(
    barRef,
    openSections,
  );
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLUListElement, HTMLAnchorElement>({
      selectedIndex: activeSection
        ? VOICE_SECTIONS_IN_PAGE_ORDER.indexOf(activeSection)
        : -1,
      fadeWidth: VOICE_SECTION_BAR_FADE_WIDTH_PX,
    });
  const styles = voiceSectionBarVariants({ isPinned });

  const selectSection = (section: TVoiceSection) => {
    holdActiveSection(section);
    onJumpToSection(section);
  };

  return (
    <section
      ref={barRef}
      aria-label={t('sectionsRegionLabel')}
      className={styles.root()}
    >
      <span aria-hidden="true" className={styles.jumpTo()}>
        {t('jumpTo')}
      </span>
      <nav aria-label={t('sectionsNavLabel')} className={styles.nav()}>
        <ul
          ref={trackRef}
          role="list"
          onScroll={onScroll}
          className={styles.list()}
        >
          {VOICE_SECTIONS_IN_PAGE_ORDER.map((section, index) => (
            <VoiceSectionChip
              key={section}
              ref={setItemRef(index)}
              section={section}
              isActive={section === activeSection}
              onSelect={selectSection}
            />
          ))}
        </ul>
        {hasMoreStart && (
          <span
            aria-hidden="true"
            data-testid={VOICE_SECTION_BAR_FADE_START_TEST_ID}
            className={styles.fade({ class: styles.fadeStart() })}
          />
        )}
        {hasMoreEnd && (
          <span
            aria-hidden="true"
            data-testid={VOICE_SECTION_BAR_FADE_END_TEST_ID}
            className={styles.fade({ class: styles.fadeEnd() })}
          />
        )}
      </nav>
      <div className={styles.actions()}>
        <Button
          size={SIZE.XS}
          variant={BUTTON_VARIANT.SECONDARY}
          focusGround={FOCUS_RING_GROUND.SURFACE}
          aria-controls={SECTION_BODY_IDS}
          onClick={() => onSetAllSectionsOpen(true)}
        >
          {t('expandAll')}
        </Button>
        <Button
          size={SIZE.XS}
          variant={BUTTON_VARIANT.SECONDARY}
          focusGround={FOCUS_RING_GROUND.SURFACE}
          aria-controls={SECTION_BODY_IDS}
          onClick={() => onSetAllSectionsOpen(false)}
        >
          {t('collapseAll')}
        </Button>
      </div>
    </section>
  );
};
