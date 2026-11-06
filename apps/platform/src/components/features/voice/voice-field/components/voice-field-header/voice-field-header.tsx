import { Field } from '@base-ui/react/field';
import { FieldResetButton } from '@platform/components/shared/field-reset-button';
import { FieldStatus } from '@platform/components/shared/field-status';
import { textVariants } from '@platform/components/shared/text/text-variants';

import { voiceFieldHeaderVariants } from './voice-field-header-variants';

export type TVoiceFieldHeaderProps = {
  label: string;
  hint: string;
  hintId: string;
  isRich: boolean;
  isInListRow: boolean;
  isCustomised: boolean;
  isUnsaved: boolean;
  onReset?: () => void;
};

export const VoiceFieldHeader = ({
  label,
  hint,
  hintId,
  isRich,
  isInListRow,
  isCustomised,
  isUnsaved,
  onReset,
}: TVoiceFieldHeaderProps) => {
  const {
    root,
    labelGroup,
    label: labelSlot,
    hint: hintSlot,
    status,
  } = voiceFieldHeaderVariants({ isInListRow });

  return (
    <div className={root()}>
      <div className={labelGroup()}>
        {isRich ? (
          !isInListRow && <span className={labelSlot()}>{label}</span>
        ) : (
          <Field.Label className={labelSlot()}>{label}</Field.Label>
        )}
        <Field.Description
          id={hintId}
          render={<span />}
          className={textVariants({ variant: 'hint', class: hintSlot() })}
        >
          {hint}
        </Field.Description>
      </div>
      <div className={status()}>
        {!isInListRow && (
          <FieldStatus isCustomised={isCustomised} isUnsaved={isUnsaved} />
        )}
        {onReset && <FieldResetButton onReset={onReset} />}
      </div>
    </div>
  );
};
