import { ICONS } from '@blog/config';
import { VoiceFieldStatus } from '@platform/components/features/voice/voice-field-status';
import { Icon } from '@platform/components/shared/icon';

import { voiceListRowVariants } from './voice-list-row-variants';

export type TVoiceListRowProps = {
  label: string;
  text: string;
  isCustomised: boolean;
  isUnsaved: boolean;
  hasError: boolean;
  onOpen: () => void;
};

export const VoiceListRow = ({
  label,
  text,
  isCustomised,
  isUnsaved,
  hasError,
  onOpen,
}: TVoiceListRowProps) => {
  const {
    root,
    label: labelSlot,
    text: textSlot,
    chevron,
  } = voiceListRowVariants({ hasError });

  return (
    <button
      type="button"
      aria-expanded={false}
      onClick={onOpen}
      className={root()}
    >
      <span className={labelSlot()}>{label}</span>
      <span className={textSlot()}>{text}</span>
      <VoiceFieldStatus isCustomised={isCustomised} isUnsaved={isUnsaved} />
      <Icon name={ICONS.CHEVRON_DOWN} className={chevron()} />
    </button>
  );
};
