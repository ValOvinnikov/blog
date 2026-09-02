import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import type { TVoiceOverrideKey } from '@platform/utils/voice-fields/voice-fields';

export type TVoiceFieldProps = {
  fieldKey: TVoiceOverrideKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The preset voice pack's value for this key — shown as the placeholder, since a blank field means "inherit" rather than "blank". */
  placeholder?: string;
  isMultiline?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
};

/**
 * One curated voice-override control: a controlled text field whose
 * placeholder is the inherited preset value. Clearing the field back to
 * empty is handled entirely by the caller (it just means `value` becomes
 * `''`) — the save path is what turns an empty string into "no override
 * stored," not this component. The visible label lives in the enclosing
 * `VoiceFieldGroup` row; `label` here only supplies the input's accessible
 * name.
 */
export const VoiceField = ({
  fieldKey,
  label,
  value,
  onChange,
  placeholder,
  isMultiline = false,
  isDisabled = false,
  isReadOnly = false,
}: TVoiceFieldProps) => {
  const inputId = `voice-field-${fieldKey}`;

  if (isMultiline) {
    return (
      <Textarea
        id={inputId}
        ariaLabel={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        rows={3}
      />
    );
  }

  return (
    <TextInput
      id={inputId}
      ariaLabel={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
    />
  );
};
