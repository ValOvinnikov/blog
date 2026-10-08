'use client';

import type { TVoiceFieldId, TVoiceSurface } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import {
  VoiceSpecimen,
  type TVoiceSpecimenTheme,
} from '@platform/components/features/site-preview/voice-specimen';
import { VoiceField } from '@platform/components/features/voice/voice-field';
import { VoiceListRow } from '@platform/components/features/voice/voice-list-row';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import {
  countCustomisedVoiceFields,
  isSameVoiceValue,
  isVoiceValueCustomised,
  voiceDefaultText,
  voiceFieldsOf,
  voiceValueAsText,
  type TVoiceDraftValue,
  type TVoiceFieldErrors,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSurfaceCardVariants } from './voice-surface-card-variants';

export type TVoiceSurfaceCardProps = {
  surface: TVoiceSurface;
  locale: TLocaleIsoCode;
  values: TVoiceLocaleDraft;
  savedValues: TVoiceLocaleDraft;
  errors: TVoiceFieldErrors;
  openFieldId?: TVoiceFieldId;
  onOpenField: (id: TVoiceFieldId) => void;
  onFieldChange: (id: TVoiceFieldId, value: TVoiceDraftValue) => void;
  isReadOnly: boolean;
  specimenTheme: TVoiceSpecimenTheme;
};

export const VoiceSurfaceCard = ({
  surface,
  locale,
  values,
  savedValues,
  errors,
  openFieldId,
  onOpenField,
  onFieldChange,
  isReadOnly,
  specimenTheme,
}: TVoiceSurfaceCardProps) => {
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tDescriptions = useTranslations('voiceSurfaceDescriptions');
  const tLabels = useTranslations('voiceFieldLabels');
  const tSpecimen = useTranslations('voiceSpecimen');
  const previewId = useId();
  const [focusedFieldId, setFocusedFieldId] = useState<TVoiceFieldId>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    body,
    fields: fieldsSlot,
    previewColumn,
    previewToggle,
    preview,
    customisedCount,
  } = voiceSurfaceCardVariants({ isPreviewOpen });
  const fields = voiceFieldsOf(surface);

  return (
    <section aria-label={tSurfaces(surface)}>
      <Card>
        <Card.Header
          title={tSurfaces(surface)}
          supportingText={tDescriptions(surface)}
          headingLevel={2}
          actions={
            <span className={customisedCount()}>
              {t('surfaceCustomisedCount', {
                count: countCustomisedVoiceFields(values, fields),
              })}
            </span>
          }
        />
        <Card.Body className={body()}>
          <div className={fieldsSlot()}>
            {fields.map((field) => {
              const value = values[field.id];
              const defaultText = voiceDefaultText(locale, field);
              const isOpen =
                openFieldId === undefined || openFieldId === field.id;

              const trackFocus = {
                onFocus: () => setFocusedFieldId(field.id),
                onBlur: () => setFocusedFieldId(undefined),
              };

              if (!isOpen) {
                const isCustomised = isVoiceValueCustomised(value);
                return (
                  <div key={field.id} {...trackFocus}>
                    <VoiceListRow
                      label={tLabels(field.id)}
                      text={
                        isCustomised ? voiceValueAsText(value) : defaultText
                      }
                      isCustomised={isCustomised}
                      isUnsaved={
                        !isSameVoiceValue(value, savedValues[field.id])
                      }
                      hasError={errors[field.id] !== undefined}
                      onOpen={() => onOpenField(field.id)}
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} {...trackFocus}>
                  <VoiceField
                    field={field}
                    value={value}
                    savedValue={savedValues[field.id]}
                    placeholder={defaultText}
                    error={errors[field.id]}
                    onChange={(next) => onFieldChange(field.id, next)}
                    isReadOnly={isReadOnly}
                  />
                </div>
              );
            })}
          </div>
          <div className={previewColumn()}>
            <Button
              className={previewToggle()}
              aria-expanded={isPreviewOpen}
              aria-controls={previewId}
              onClick={() => setIsPreviewOpen((open) => !open)}
            >
              {tSpecimen(isPreviewOpen ? 'hidePreview' : 'showPreview')}
            </Button>
            <div id={previewId} className={preview()}>
              <VoiceSpecimen
                surface={surface}
                locale={locale}
                values={values}
                openListFieldId={openFieldId}
                focusedFieldId={focusedFieldId}
                theme={specimenTheme}
              />
            </div>
          </div>
        </Card.Body>
      </Card>
    </section>
  );
};
