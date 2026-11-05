'use client';

import { ICONS, type TVoiceSurface } from '@blog/config';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { FieldStatus } from '@platform/components/shared/field-status';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import type { TVoiceSection } from '@platform/constants/voice';
import {
  countCustomisedVoiceFields,
  VOICE_SURFACES_BY_SECTION,
  voiceFieldsOf,
} from '@platform/utils/voice-draft/voice-draft';
import {
  voiceCardHref,
  voiceSurfaceUnit,
} from '@platform/utils/voice-sections/voice-sections';
import { useTranslations } from 'next-intl';

import { voiceSectionSummaryVariants } from './voice-section-summary-variants';

export type TVoiceSectionSummaryProps = {
  section: TVoiceSection;
  onJumpToCard: (surface: TVoiceSurface) => void;
};

export const VoiceSectionSummary = ({
  section,
  onJumpToCard,
}: TVoiceSectionSummaryProps) => {
  const { values } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tDescriptions = useTranslations('voiceSurfaceDescriptions');
  const { list, item, row, name, description, count, chevron } =
    voiceSectionSummaryVariants();

  return (
    <ul role="list" className={list()}>
      {VOICE_SURFACES_BY_SECTION[section].map((surface) => {
        const fields = voiceFieldsOf(surface);

        return (
          <li key={surface} className={item()}>
            <a
              href={voiceCardHref(surface)}
              className={row()}
              onClick={(event) => {
                event.preventDefault();
                onJumpToCard(surface);
              }}
            >
              <span className={name()}>{tSurfaces(surface)}</span>
              <span className={description()}>{tDescriptions(surface)}</span>
              <span className={count()}>
                {t('surfaceCount', {
                  unit: voiceSurfaceUnit(surface),
                  total: fields.length,
                })}
              </span>
              <FieldStatus
                isCustomised={countCustomisedVoiceFields(values, fields) > 0}
                isUnsaved={false}
              />
              <Icon
                name={ICONS.CHEVRON_RIGHT}
                size={ICON_SIZE.MD}
                className={chevron()}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
};
