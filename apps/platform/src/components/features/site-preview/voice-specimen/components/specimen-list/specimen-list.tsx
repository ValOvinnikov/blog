import type { TVoiceFieldId, TVoicePortableText } from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { headingVariants } from '@blog/ui/components/atoms/heading/heading-variants';
import { Text } from '@blog/ui/components/atoms/text';
import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';

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
      <p className={headingVariants({ visual: 'section' })}>{heading}</p>
      <Text variant="meta">{count}</Text>
      <p className={s.emptyMessage()}>
        <VoiceKeyFrame
          fieldId={fieldId}
          isFocused={fieldId === focusedFieldId}
          isInline={true}
        >
          <VoiceRichText value={value} params={{ name: heading }} />
        </VoiceKeyFrame>
      </p>
    </div>
  );
};
