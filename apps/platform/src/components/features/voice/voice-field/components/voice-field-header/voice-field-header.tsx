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
    labelRow,
    label: labelSlot,
    hintRow,
    hint: hintSlot,
  } = voiceFieldHeaderVariants({ isInListRow });

  return (
    <>
      {isInListRow ? (
        !isRich && <Field.Label className={labelSlot()}>{label}</Field.Label>
      ) : (
        <div className={labelRow()}>
          {isRich ? (
            <span className={labelSlot()}>{label}</span>
          ) : (
            <Field.Label className={labelSlot()}>{label}</Field.Label>
          )}
          <FieldStatus isCustomised={isCustomised} isUnsaved={isUnsaved} />
        </div>
      )}
      <div className={hintRow()}>
        <Field.Description
          id={hintId}
          render={<span />}
          className={textVariants({ variant: 'hint', class: hintSlot() })}
        >
          {hint}
        </Field.Description>
        {onReset && <FieldResetButton onReset={onReset} />}
      </div>
    </>
  );
};
