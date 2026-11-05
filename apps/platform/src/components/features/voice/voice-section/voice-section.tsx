'use client';

import type { TVoiceSurface } from '@blog/config';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceSurfaceCard } from '@platform/components/features/voice/voice-surface-card';
import { Disclosure } from '@platform/components/shared/disclosure';
import {
  VOICE_COUNT_UNIT,
  VOICE_SECTION_ID,
  type TVoiceSection,
} from '@platform/constants/voice';
import { VOICE_SURFACES_BY_SECTION } from '@platform/utils/voice-draft/voice-draft';
import {
  countVoiceSectionCustomised,
  countVoiceSectionErrors,
  voiceSectionFields,
} from '@platform/utils/voice-sections/voice-sections';
import { useTranslations } from 'next-intl';

import { VoiceSectionSummary } from './components/voice-section-summary';
import { voiceSectionVariants } from './voice-section-variants';

export type TVoiceSectionProps = {
  section: TVoiceSection;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onJumpToCard: (surface: TVoiceSurface) => void;
};

export const VoiceSection = ({
  section,
  isOpen,
  onOpenChange,
  onJumpToCard,
}: TVoiceSectionProps) => {
  const { values, errors } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tSections = useTranslations('voiceSections');
  const tSaveBar = useTranslations('saveBar');
  const ids = VOICE_SECTION_ID[section];
  const errorCount = countVoiceSectionErrors(errors, section);
  const hasErrors = errorCount > 0;
  const { root, disclosure, titleBlock, title, meta, cards } =
    voiceSectionVariants({ isOpen, hasErrors });
  const count = t('surfaceCount', {
    unit: VOICE_COUNT_UNIT.FIELDS,
    total: voiceSectionFields(section).length,
  });
  const status = hasErrors
    ? tSaveBar('fieldsNeedAttention', { count: errorCount })
    : t('customisedStatus', {
        count: countVoiceSectionCustomised(values, section),
      });

  return (
    <section id={ids.section} aria-labelledby={ids.heading} className={root()}>
      <Disclosure
        variant="section"
        className={disclosure()}
        heading={{ level: 2, id: ids.heading }}
        openState={{ isOpen, onOpenChange }}
        collapsedBody={{
          id: ids.body,
          content: (
            <VoiceSectionSummary
              section={section}
              onJumpToCard={onJumpToCard}
            />
          ),
        }}
        summary={
          <span className={titleBlock()}>
            <span className={title()}>{tSections(section)}</span>
            <span className={meta()}>
              {t('surfaceSummary', { count, status })}
            </span>
          </span>
        }
      >
        <div className={cards()}>
          {VOICE_SURFACES_BY_SECTION[section].map((surface) => (
            <VoiceSurfaceCard key={surface} surface={surface} />
          ))}
        </div>
      </Disclosure>
    </section>
  );
};
