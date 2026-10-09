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
  voiceFieldInputId,
  voiceFieldsOf,
  voiceValueAsText,
  type TVoiceDraftValue,
  type TVoiceField,
  type TVoiceFieldErrors,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSurfaceCardVariants } from './voice-surface-card-variants';

export type TVoiceSurfaceCardProps = {
  surface: TVoiceSurface;
  locale: TLocaleIsoCode;
  fieldIdPrefix: string;
  values: TVoiceLocaleDraft;
  savedValues: TVoiceLocaleDraft;
  errors: TVoiceFieldErrors;
  openFieldId?: TVoiceFieldId;
  onOpenField: (id: TVoiceFieldId) => void;
  onFieldChange: (id: TVoiceFieldId, value: TVoiceDraftValue) => void;
  isReadOnly: boolean;
  specimenTheme: TVoiceSpecimenTheme;
};

type TVoiceFieldGroup = {
  key: TVoiceFieldId;
  isCollapsed: boolean;
  fields: TVoiceField[];
};

const groupCollapsedFields = (
  fields: TVoiceField[],
  openFieldId: TVoiceFieldId | undefined,
): TVoiceFieldGroup[] =>
  fields.reduce<TVoiceFieldGroup[]>((groups, field) => {
    const isCollapsed = openFieldId !== undefined && openFieldId !== field.id;
    const last = groups.at(-1);
    if (last?.isCollapsed === isCollapsed) {
      last.fields.push(field);
      return groups;
    }
    return [...groups, { key: field.id, isCollapsed, fields: [field] }];
  }, []);

export const VoiceSurfaceCard = ({
  surface,
  locale,
  fieldIdPrefix,
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
  const tNotes = useTranslations('voiceSurfaceNotes');
  const tPreview = useTranslations('lookPreview');
  const previewId = useId();
  const previewLabelId = useId();
  const [focusedFieldId, setFocusedFieldId] = useState<TVoiceFieldId>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    body,
    fields: fieldsSlot,
    collapsedList,
    previewColumn,
    previewToggle,
    preview,
    previewLabel,
    previewNote,
    customisedCount,
  } = voiceSurfaceCardVariants({ isPreviewOpen });
  const fields = voiceFieldsOf(surface);
  const trackFocusOf = (id: TVoiceFieldId) => ({
    onFocus: () => setFocusedFieldId(id),
    onBlur: () => setFocusedFieldId(undefined),
  });

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
            {groupCollapsedFields(fields, openFieldId).flatMap((group) => {
              if (group.isCollapsed) {
                return (
                  <div key={group.key} className={collapsedList()}>
                    {group.fields.map((field) => {
                      const value = values[field.id];
                      const isCustomised = isVoiceValueCustomised(value);
                      return (
                        <div key={field.id} {...trackFocusOf(field.id)}>
                          <VoiceListRow
                            label={tLabels(field.id)}
                            text={
                              isCustomised
                                ? voiceValueAsText(value)
                                : voiceDefaultText(locale, field)
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
                    })}
                  </div>
                );
              }

              return group.fields.map((field) => (
                <div key={field.id} {...trackFocusOf(field.id)}>
                  <VoiceField
                    inputId={voiceFieldInputId(fieldIdPrefix, field.id)}
                    field={field}
                    value={values[field.id]}
                    savedValue={savedValues[field.id]}
                    placeholder={voiceDefaultText(locale, field)}
                    error={errors[field.id]}
                    onChange={(next) => onFieldChange(field.id, next)}
                    isReadOnly={isReadOnly}
                  />
                </div>
              ));
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
                openListFieldId={openFieldId}
                focusedFieldId={focusedFieldId}
                theme={specimenTheme}
              />
              <p className={previewNote()}>{tNotes(surface)}</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </section>
  );
};
