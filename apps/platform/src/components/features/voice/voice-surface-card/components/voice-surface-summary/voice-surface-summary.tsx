'use client';

import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import {
  countCustomisedVoiceFields,
  voiceFieldsOf,
} from '@platform/utils/voice-draft/voice-draft';
import { voiceSurfaceUnit } from '@platform/utils/voice-sections/voice-sections';
import type { TVoiceSurface } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { voiceSurfaceSummaryVariants } from './voice-surface-summary-variants';

export type TVoiceSurfaceSummaryProps = {
  surface: TVoiceSurface;
};

export const VoiceSurfaceSummary = ({ surface }: TVoiceSurfaceSummaryProps) => {
  const { values } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const fields = voiceFieldsOf(surface);

  return (
    <span className={voiceSurfaceSummaryVariants()}>
      {t('surfaceSummary', {
        count: t('surfaceCount', {
          unit: voiceSurfaceUnit(surface),
          total: fields.length,
        }),
        status: t('customisedStatus', {
          count: countCustomisedVoiceFields(values, fields),
        }),
      })}
    </span>
  );
};
