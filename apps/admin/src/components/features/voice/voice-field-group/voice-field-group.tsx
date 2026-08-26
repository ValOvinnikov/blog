import { VoiceField } from '@admin/components/features/voice/voice-field';
import { Card } from '@admin/components/shared/card';
import { Heading } from '@admin/components/shared/heading';
import type {
  TVoiceField,
  TVoiceOverrideKey,
  TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';
import { useTranslations } from 'next-intl';

import { voiceFieldGroupVariants } from './voice-field-group-variants';

export type TVoiceFieldGroupProps = {
  title: string;
  fields: (TVoiceField & { label: string })[];
  values: TVoiceOverrides;
  placeholders: Partial<Record<TVoiceOverrideKey, string>>;
  onFieldChange: (key: TVoiceOverrideKey, value: string) => void;
  isDisabled?: boolean;
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
}: TVoiceFieldGroupProps) => {
  const t = useTranslations('voiceFieldGroup');
  const { body, vfield, vfieldLabel, vfieldKey } = voiceFieldGroupVariants();

  return (
    <Card>
      <Card.Header
        title={title}
        supportingText={t('fieldCount', { count: fields.length })}
      />
      <Card.Body className={body()}>
        {fields.map((field) => (
          <div key={field.key} className={vfield()}>
            <Heading level={4} size="fieldLabel" className={vfieldLabel()}>
              {field.label} <code className={vfieldKey()}>{field.key}</code>
            </Heading>
            <VoiceField
              fieldKey={field.key}
              label={field.label}
              value={values[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              placeholder={placeholders[field.key]}
              isMultiline={field.multiline}
              isDisabled={isDisabled}
            />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};
