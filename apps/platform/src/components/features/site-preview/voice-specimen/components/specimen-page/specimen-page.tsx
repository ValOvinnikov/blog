import type { TVoiceFieldId, TVoicePortableText } from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { headingVariants } from '@blog/ui/components/atoms/heading/heading-variants';
import { Text } from '@blog/ui/components/atoms/text';
import { isString } from '@blog/utils/primitives';
import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';
import type { ReactNode } from 'react';

import { specimenPageVariants } from './specimen-page-variants';

type TSpecimenPageField = {
  fieldId: TVoiceFieldId;
  value: string | TVoicePortableText;
};

export type TSpecimenPageProps = {
  eyebrow?: TSpecimenPageField;
  heading?: TSpecimenPageField;
  body?: TSpecimenPageField;
  focusedFieldId?: TVoiceFieldId;
  actions: ReactNode;
};

export const SpecimenPage = ({
  eyebrow,
  heading,
  body,
  focusedFieldId,
  actions,
}: TSpecimenPageProps) => {
  const s = specimenPageVariants();
  const eyebrowText = eyebrow?.value;

  return (
    <div className={s.root()}>
      {eyebrow && isString(eyebrowText) && eyebrowText.trim() !== '' && (
        <VoiceKeyFrame
          fieldId={eyebrow.fieldId}
          isFocused={eyebrow.fieldId === focusedFieldId}
        >
          <Eyebrow>{eyebrowText}</Eyebrow>
        </VoiceKeyFrame>
      )}
      {heading && (
        <VoiceKeyFrame
          fieldId={heading.fieldId}
          isFocused={heading.fieldId === focusedFieldId}
        >
          <p className={headingVariants({ visual: 'hero' })}>
            <VoiceRichText value={heading.value} />
          </p>
        </VoiceKeyFrame>
      )}
      {body && (
        <Text className={s.copy()}>
          <VoiceKeyFrame
            fieldId={body.fieldId}
            isFocused={body.fieldId === focusedFieldId}
            isInline={true}
          >
            <VoiceRichText value={body.value} />
          </VoiceKeyFrame>
        </Text>
      )}
      <div className={s.actions()}>{actions}</div>
    </div>
  );
};
