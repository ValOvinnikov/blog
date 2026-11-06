'use client';

import {
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import { useVoiceEditor } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceField } from '@platform/components/features/voice/voice-field';
import { VoiceListRow } from '@platform/components/features/voice/voice-list-row';
import { Accordion } from '@platform/components/shared/accordion';
import { Card } from '@platform/components/shared/card';
import { VOICE_CARD_ID } from '@platform/constants/voice';
import { voiceFieldsOf } from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { VoiceSurfacePreview } from './components/voice-surface-preview';
import { VoiceSurfaceSummary } from './components/voice-surface-summary';
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
  } = useVoiceEditor();
  const tSurfaces = useTranslations('voiceSurfaces');
  const tDescriptions = useTranslations('voiceSurfaceDescriptions');
  const [focusedFieldId, setFocusedFieldId] = useState<TVoiceFieldId>();
  const isArchive = surface === VOICE_SURFACE.ARCHIVE;
  const {
    body,
    fields: fieldsSlot,
    card,
  } = voiceSurfaceCardVariants({ isArchive });
  const ids = VOICE_CARD_ID[surface];
  const openFieldId = isArchive ? openListFieldId : undefined;
  const fields = voiceFieldsOf(surface);
  const trackFocusOf = (id: TVoiceFieldId) => ({
    onFocus: () => setFocusedFieldId(id),
    onBlur: () => setFocusedFieldId(undefined),
  });

  return (
    <Card id={ids.card} className={card()}>
      <Card.Header
        title={tSurfaces(surface)}
        headingLevel={3}
        titleId={ids.heading}
        titleTabIndex={-1}
        supportingText={tDescriptions(surface)}
        actions={<VoiceSurfaceSummary surface={surface} />}
      />
      <Card.Body className={body()}>
        <div className={fieldsSlot()}>
          {isArchive ? (
            <Accordion
              isList={true}
              openValue={openFieldId}
              onOpenValueChange={setOpenListFieldId}
            >
              {fields.map((field) => (
                <VoiceListRow
                  key={field.id}
                  field={field}
                  locale={locale}
                  value={values[field.id]}
                  savedValue={savedValues[field.id]}
                  error={errors[field.id]}
                  isOpen={openFieldId === field.id}
                >
                  <div {...trackFocusOf(field.id)}>
                    <VoiceField field={field} />
                  </div>
                </VoiceListRow>
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
        <VoiceSurfacePreview
          surface={surface}
          openListFieldId={openFieldId}
          focusedFieldId={focusedFieldId}
        />
      </Card.Body>
    </Card>
  );
};
