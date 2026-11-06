'use client';

import {
  SIZE,
  VOICE_SURFACE,
  type TMaybeUndefined,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { VoiceSpecimen } from '@platform/components/features/site-preview/voice-specimen';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { useVoiceListSamples } from '@platform/components/features/voice/voice-list-samples-provider';
import { Button } from '@platform/components/shared/button';
import { voiceFieldsOf } from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSurfacePreviewVariants } from './voice-surface-preview-variants';

export type TVoiceSurfacePreviewProps = {
  surface: TVoiceSurface;
  openListFieldId: TMaybeUndefined<TVoiceFieldId>;
  focusedFieldId: TMaybeUndefined<TVoiceFieldId>;
};

export const VoiceSurfacePreview = ({
  surface,
  openListFieldId,
  focusedFieldId,
}: TVoiceSurfacePreviewProps) => {
  const { locale, values, specimenTheme } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tLabels = useTranslations('voiceFieldLabels');
  const tSpecimen = useTranslations('voiceSpecimen');
  const tNotes = useTranslations('voiceSurfaceNotes');
  const listSamples = useVoiceListSamples(locale);
  const previewId = useId();
  const labelId = useId();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isArchive = surface === VOICE_SURFACE.ARCHIVE;
  const { column, content, toggle, preview, label, specimen, note } =
    voiceSurfacePreviewVariants({ isArchive, isPreviewOpen });
  const [firstField] = voiceFieldsOf(surface);
  const labelFieldId = isArchive
    ? (openListFieldId ?? firstField?.id)
    : undefined;

  return (
    <div className={column()}>
      <div className={content()}>
        {isArchive && (
          <Button
            size={SIZE.LG}
            className={toggle()}
            aria-expanded={isPreviewOpen}
            aria-controls={previewId}
            onClick={() => setIsPreviewOpen((open) => !open)}
          >
            {tSpecimen(isPreviewOpen ? 'hidePreview' : 'showPreview')}
          </Button>
        )}
        <div
          id={previewId}
          role="group"
          aria-labelledby={labelId}
          className={preview()}
        >
          <p id={labelId} className={label()}>
            {t('previewLabel', {
              hasField: String(!isUndefined(labelFieldId)),
              field: isUndefined(labelFieldId) ? '' : tLabels(labelFieldId),
            })}
          </p>
          <div className={specimen()}>
            <VoiceSpecimen
              surface={surface}
              locale={locale}
              values={values}
              listSamples={listSamples}
              openListFieldId={openListFieldId}
              focusedFieldId={focusedFieldId}
              theme={specimenTheme}
            />
          </div>
          <p className={note()}>{tNotes(surface)}</p>
        </div>
      </div>
    </div>
  );
};
