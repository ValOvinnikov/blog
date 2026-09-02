import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import {
  voiceFieldInputId,
  type TVoiceOverrideKey,
} from '@platform/utils/voice-fields/voice-fields';

export type TVoiceFieldProps = {
  fieldKey: TVoiceOverrideKey;
  value: string;
  onChange: (value: string) => void;
  /** The preset voice pack's value for this key — shown as the placeholder, since a blank field means "inherit" rather than "blank". */
  placeholder?: string;
  isMultiline?: boolean;
  isDisabled?: boolean;
};

/**
 * One curated voice-override control: a controlled text field whose
 * placeholder is the inherited preset value. Clearing the field back to
 * empty is handled entirely by the caller (it just means `value` becomes
 * `''`) — the save path is what turns an empty string into "no override
 * stored," not this component. Its accessible name comes from the
 * `<label htmlFor>` the enclosing `VoiceFieldGroup` row renders for the
 * same id.
 */
export const VoiceField = ({
  fieldKey,
  value,
  onChange,
  placeholder,
  isMultiline = false,
  isDisabled = false,
}: TVoiceFieldProps) => {
  const inputId = voiceFieldInputId(fieldKey);

  if (isMultiline) {
    return (
      <Textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        rows={3}
      />
    );
  }

  return (
    <TextInput
      id={inputId}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
    />
  );
};
