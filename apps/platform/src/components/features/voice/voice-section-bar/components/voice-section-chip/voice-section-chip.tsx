'use client';

import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import type { TVoiceSection } from '@platform/constants/voice';
import {
  countVoiceSectionCustomised,
  voiceSectionHref,
} from '@platform/utils/voice-sections/voice-sections';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { voiceSectionChipVariants } from './voice-section-chip-variants';

export type TVoiceSectionChipProps = {
  section: TVoiceSection;
  isActive: boolean;
  onSelect: (section: TVoiceSection) => void;
  ref?: Ref<HTMLAnchorElement>;
};

export const VoiceSectionChip = ({
  section,
  isActive,
  onSelect,
  ref,
}: TVoiceSectionChipProps) => {
  const { values } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tSections = useTranslations('voiceSections');
  const customised = countVoiceSectionCustomised(values, section);
  const { item, link, count } = voiceSectionChipVariants({ isActive });

  return (
    <li className={item()}>
      <a
        ref={ref}
        href={voiceSectionHref(section)}
        aria-current={isActive ? 'true' : undefined}
        onClick={(event) => {
          event.preventDefault();
          onSelect(section);
        }}
        className={link()}
      >
        {tSections(section)}
        {customised > 0 && (
          <span className={count()}>
            {t('customisedStatus', { count: customised })}
          </span>
        )}
      </a>
    </li>
  );
};
