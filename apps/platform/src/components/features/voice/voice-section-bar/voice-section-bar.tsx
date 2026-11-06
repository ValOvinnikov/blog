'use client';

import {
  VOICE_SECTION_BAR_FADE_END_TEST_ID,
  VOICE_SECTION_BAR_FADE_START_TEST_ID,
  type TVoiceSection,
} from '@platform/constants/voice';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { VOICE_SECTIONS_IN_PAGE_ORDER } from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { VoiceSectionBarActions } from './components/voice-section-bar-actions';
import { VoiceSectionChip } from './components/voice-section-chip';
import { useActiveVoiceSection } from './use-active-voice-section';
import { useIsSectionBarPinned } from './use-is-section-bar-pinned';
import { useVoiceSectionBarHeight } from './use-voice-section-bar-height';
import {
  VOICE_SECTION_BAR_REVEAL_INSET_PX,
  voiceSectionBarVariants,
} from './voice-section-bar-variants';

export type TVoiceSectionBarProps = {
  openSections: readonly TVoiceSection[];
  onJumpToSection: (section: TVoiceSection) => void;
  onSetAllSectionsOpen: (isOpen: boolean) => void;
};

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
  const shownActiveSection = isPinned ? activeSection : undefined;
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLUListElement, HTMLAnchorElement>({
      selectedIndex: shownActiveSection
        ? VOICE_SECTIONS_IN_PAGE_ORDER.indexOf(shownActiveSection)
        : -1,
      fadeWidth: VOICE_SECTION_BAR_REVEAL_INSET_PX,
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
              isActive={section === shownActiveSection}
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
      <VoiceSectionBarActions
        isEverySectionOpen={
          openSections.length === VOICE_SECTIONS_IN_PAGE_ORDER.length
        }
        onSetAllSectionsOpen={onSetAllSectionsOpen}
      />
    </section>
  );
};
