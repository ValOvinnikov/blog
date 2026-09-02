import { VoiceField } from '@platform/components/features/voice/voice-field';
import { Card } from '@platform/components/shared/card';
import {
  voiceFieldInputId,
  type TVoiceField,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
} from '@platform/utils/voice-fields/voice-fields';
import { useTranslations } from 'next-intl';

import { voiceFieldGroupVariants } from './voice-field-group-variants';

export type TVoiceFieldGroupProps = {
  title: string;
  fields: (TVoiceField & { label: string })[];
  values: TVoiceOverrides;
  placeholders: Partial<Record<TVoiceOverrideKey, string>>;
  onFieldChange: (key: TVoiceOverrideKey, value: string) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
};

/**
 * One curated-voice card: a `Card` header matching the CMS schema's
 * fieldset titles over its member fields, each rendered as its own
 * label-above-input `.vfield`, per `admin-panel-mock.html`'s Voice section.
 */
export const VoiceFieldGroup = ({
  title,
  fields,
  values,
  placeholders,
  onFieldChange,
  isDisabled = false,
  isReadOnly = false,
}: TVoiceFieldGroupProps) => {
  const t = useTranslations('voiceFieldGroup');
  const { body, vfield, vfieldLabel, vfieldKey } = voiceFieldGroupVariants();

  return (
    <Card>
      <Card.Header
        title={title}
        supportingText={t('fieldCount', { count: fields.length })}
        headingLevel={2}
      />
      <Card.Body className={body()}>
        {fields.map((field) => (
          <div key={field.key} className={vfield()}>
            <label
              htmlFor={voiceFieldInputId(field.key)}
              className={vfieldLabel()}
            >
              {field.label}{' '}
              <code aria-hidden="true" className={vfieldKey()}>
                {field.key}
              </code>
            </label>
            <VoiceField
              fieldKey={field.key}
              value={values[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              placeholder={placeholders[field.key]}
              isMultiline={field.multiline}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
            />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};
