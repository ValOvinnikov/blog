'use client';

import { ICONS } from '@blog/config';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import type { TVoiceSection } from '@platform/constants/voice';
import {
  countVoiceSectionCustomised,
  countVoiceSectionErrors,
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
  const { values, errors } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tSections = useTranslations('voiceSections');
  const customised = countVoiceSectionCustomised(values, section);
  const errorCount = countVoiceSectionErrors(errors, section);
  const { item, link, count, errorPill } = voiceSectionChipVariants({
    isActive,
  });

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
        {errorCount > 0 ? (
          <span className={errorPill()}>
            <Icon
              name={ICONS.ERROR}
              size={ICON_SIZE.XXS}
              strokeWidth={ICON_STROKE_WIDTH.CHIP_ERROR}
            />
            {t('chipErrors', { count: errorCount })}
          </span>
        ) : (
          customised > 0 && (
            <span className={count()}>
              {t('customisedStatus', { count: customised })}
            </span>
          )
        )}
      </a>
    </li>
  );
};
