'use client';

import {
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import { VoiceSpecimen } from '@platform/components/features/site-preview/voice-specimen';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceField } from '@platform/components/features/voice/voice-field';
import { VoiceListRow } from '@platform/components/features/voice/voice-list-row';
import { useVoiceListSamples } from '@platform/components/features/voice/voice-list-samples-provider';
import { Accordion } from '@platform/components/shared/accordion';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import {
  countCustomisedVoiceFields,
  voiceFieldsOf,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSurfaceCardVariants } from './voice-surface-card-variants';

export type TVoiceSurfaceCardProps = {
  surface: TVoiceSurface;
};

export const VoiceSurfaceCard = ({ surface }: TVoiceSurfaceCardProps) => {
  const {
    locale,
    values,
    savedValues,
    errors,
    openListFieldId,
    setOpenListFieldId,
    specimenTheme,
  } = useVoiceEditor();
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tDescriptions = useTranslations('voiceSurfaceDescriptions');
  const tSpecimen = useTranslations('voiceSpecimen');
  const tNotes = useTranslations('voiceSurfaceNotes');
  const tPreview = useTranslations('previewModeControl');
  const listSamples = useVoiceListSamples(locale);
  const previewId = useId();
  const previewLabelId = useId();
  const [focusedFieldId, setFocusedFieldId] = useState<TVoiceFieldId>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    body,
    fields: fieldsSlot,
    previewColumn,
    previewContent,
    previewToggle,
    preview,
    previewLabel,
    previewNote,
    summary,
  } = voiceSurfaceCardVariants({ isPreviewOpen });
  const isArchive = surface === VOICE_SURFACE.ARCHIVE;
  const openFieldId = isArchive ? openListFieldId : undefined;
  const fields = voiceFieldsOf(surface);
  const trackFocusOf = (id: TVoiceFieldId) => ({
    onFocus: () => setFocusedFieldId(id),
    onBlur: () => setFocusedFieldId(undefined),
  });

  return (
    <Card>
      <Card.Header
        title={tSurfaces(surface)}
        supportingText={tDescriptions(surface)}
        actions={
          <span className={summary()}>
            {t('surfaceSummary', {
              unit: isArchive ? 'lists' : 'fields',
              total: fields.length,
              customised: countCustomisedVoiceFields(values, fields),
            })}
          </span>
        }
      />
      <Card.Body className={body()}>
        <div className={fieldsSlot()}>
          {isArchive ? (
            <Accordion
              openValue={openFieldId}
              onOpenValueChange={setOpenListFieldId}
            >
              {fields.map((field) => (
                <div key={field.id} {...trackFocusOf(field.id)}>
                  <VoiceListRow
                    field={field}
                    locale={locale}
                    value={values[field.id]}
                    savedValue={savedValues[field.id]}
                    error={errors[field.id]}
                    isOpen={openFieldId === field.id}
                  >
                    <VoiceField field={field} />
                  </VoiceListRow>
                </div>
              ))}
            </Accordion>
          ) : (
            fields.map((field) => (
              <div key={field.id} {...trackFocusOf(field.id)}>
                <VoiceField field={field} />
              </div>
            ))
          )}
        </div>
        <div className={previewColumn()}>
          <div className={previewContent()}>
            <Button
              className={previewToggle()}
              aria-expanded={isPreviewOpen}
              aria-controls={previewId}
              onClick={() => setIsPreviewOpen((open) => !open)}
            >
              {tSpecimen(isPreviewOpen ? 'hidePreview' : 'showPreview')}
            </Button>
            <div
              id={previewId}
              role="group"
              aria-labelledby={previewLabelId}
              className={preview()}
            >
              <p id={previewLabelId} className={previewLabel()}>
                {tPreview('livePreviewHeading')}
              </p>
              <VoiceSpecimen
                surface={surface}
                locale={locale}
                values={values}
                listSamples={listSamples}
                openListFieldId={openFieldId}
                focusedFieldId={focusedFieldId}
                theme={specimenTheme}
              />
              <p className={previewNote()}>{tNotes(surface)}</p>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
