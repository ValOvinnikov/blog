import { VoiceField } from '@admin/components/voice-field';
import type {
  TVoiceField,
  TVoiceOverrideKey,
  TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';

import { voiceFieldGroupVariants } from './voice-field-group-variants';

export type TVoiceFieldGroupProps = {
  title: string;
  fields: TVoiceField[];
  values: TVoiceOverrides;
  placeholders: Partial<Record<TVoiceOverrideKey, string>>;
  onFieldChange: (key: TVoiceOverrideKey, value: string) => void;
  disabled?: boolean;
};

/**
 * One curated-voice card: a group heading (matching the CMS schema's
 * fieldset titles) over its member fields.
 */
export function VoiceFieldGroup({
  title,
  fields,
  values,
  placeholders,
  onFieldChange,
  disabled = false,
}: TVoiceFieldGroupProps) {
  const {
    root,
    header,
    title: titleSlot,
    count,
    body,
  } = voiceFieldGroupVariants();

  return (
    <div className={root()}>
      <div className={header()}>
        <h3 className={titleSlot()}>{title}</h3>
        <span className={count()}>
          {fields.length} field{fields.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className={body()}>
        {fields.map((field) => (
          <VoiceField
            key={field.key}
            fieldKey={field.key}
            label={field.label}
            value={values[field.key]}
            onChange={(value) => onFieldChange(field.key, value)}
            placeholder={placeholders[field.key]}
            multiline={field.multiline}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
