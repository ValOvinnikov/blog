import type { TVoiceOverrideKey } from '@admin/utils/voice-fields/voice-fields';
import { TextInput, Textarea } from '@blog/ui/atoms';

import { voiceFieldVariants } from './voice-field-variants';

export type TVoiceFieldProps = {
  fieldKey: TVoiceOverrideKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The preset voice pack's value for this key — shown as the placeholder, since a blank field means "inherit" rather than "blank". */
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
};

/**
 * One curated voice-override row: a visible label + its storage key, and a
 * controlled text field whose placeholder is the inherited preset value.
 * Clearing the field back to empty is handled entirely by the caller (it
 * just means `value` becomes `''`) — the save path is what turns an empty
 * string into "no override stored," not this component.
 */
export function VoiceField({
  fieldKey,
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  disabled = false,
}: TVoiceFieldProps) {
  const {
    root,
    labelRow,
    label: labelSlot,
    keyBadge,
    control,
  } = voiceFieldVariants();
  const inputId = `voice-field-${fieldKey}`;

  return (
    <div className={root()}>
      <div className={labelRow()}>
        <label htmlFor={inputId} className={labelSlot()}>
          {label}
        </label>
        <code className={keyBadge()}>{fieldKey}</code>
      </div>
      {multiline ? (
        <Textarea
          id={inputId}
          ariaLabel={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={control()}
        />
      ) : (
        <TextInput
          id={inputId}
          ariaLabel={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={control()}
        />
      )}
    </div>
  );
}
