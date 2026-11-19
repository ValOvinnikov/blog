import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';
import {
  TEXT_ROLE,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Text } from '@shinefold/ui/components/atoms/text';
import { isString } from '@shinefold/utils/primitives';
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
          <Text textRole={TEXT_ROLE.HERO_TITLE}>
            <VoiceRichText value={heading.value} />
          </Text>
        </VoiceKeyFrame>
      )}
      {body && (
        <Text textRole={TEXT_ROLE.INTRO} className={s.copy()}>
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
