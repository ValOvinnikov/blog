import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';
import {
  TEXT_ROLE,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Text } from '@shinefold/ui/components/atoms/text';

import { specimenListVariants } from './specimen-list-variants';

export type TSpecimenListSample = {
  eyebrow: string;
  heading: string;
  count: string;
};

export type TSpecimenListProps = {
  fieldId: TVoiceFieldId;
  value: string | TVoicePortableText;
  sample: TSpecimenListSample;
  focusedFieldId?: TVoiceFieldId;
};

export const SpecimenList = ({
  fieldId,
  value,
  sample,
  focusedFieldId,
}: TSpecimenListProps) => {
  const s = specimenListVariants();
  const { eyebrow, heading, count } = sample;

  return (
    <div className={s.root()}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text textRole={TEXT_ROLE.SECTION_TITLE}>{heading}</Text>
      <Text textRole={TEXT_ROLE.META}>{count}</Text>
      <Text textRole={TEXT_ROLE.CARD_BODY}>
        <VoiceKeyFrame
          fieldId={fieldId}
          isFocused={fieldId === focusedFieldId}
          isInline={true}
        >
          <VoiceRichText value={value} params={{ name: heading }} />
        </VoiceKeyFrame>
      </Text>
    </div>
  );
};
