'use client';

import type { TVoiceFieldId, TVoiceSurface } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { VoiceField } from '@platform/components/features/voice/voice-field';
import { VoiceListRow } from '@platform/components/features/voice/voice-list-row';
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
}: TVoiceSurfaceCardProps) => {
  const t = useTranslations('voiceSettings');
  const tSurfaces = useTranslations('voiceSurfaces');
  const tDescriptions = useTranslations('voiceSurfaceDescriptions');
  const tLabels = useTranslations('voiceFieldLabels');
  const { body, customisedCount } = voiceSurfaceCardVariants();
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
          {fields.map((field) => {
            const value = values[field.id];
            const defaultText = voiceDefaultText(locale, field);
            const isOpen =
              openFieldId === undefined || openFieldId === field.id;

            if (!isOpen) {
              const isCustomised = isVoiceValueCustomised(value);
              return (
                <VoiceListRow
                  key={field.id}
                  label={tLabels(field.id)}
                  text={isCustomised ? voiceValueAsText(value) : defaultText}
                  isCustomised={isCustomised}
                  isUnsaved={!isSameVoiceValue(value, savedValues[field.id])}
                  hasError={errors[field.id] !== undefined}
                  onOpen={() => onOpenField(field.id)}
                />
              );
            }

            return (
              <VoiceField
                key={field.id}
                field={field}
                value={value}
                savedValue={savedValues[field.id]}
                placeholder={defaultText}
                error={errors[field.id]}
                onChange={(next) => onFieldChange(field.id, next)}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </Card.Body>
      </Card>
    </section>
  );
};
