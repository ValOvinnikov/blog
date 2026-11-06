'use client';

import type { TMaybeUndefined, TVoiceFieldId } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceSection } from '@platform/constants/voice';
import type { TInvalidControls } from '@platform/utils/reveal-first-invalid-control/reveal-first-invalid-control';
import {
  voiceErrorReveal,
  voiceFieldInputId,
  type TVoiceFieldError,
} from '@platform/utils/voice-draft/voice-draft';
import { voiceSectionOfField } from '@platform/utils/voice-sections/voice-sections';
import { useState } from 'react';

type TUseVoiceErrorRevealArgs = {
  fieldIdPrefix: string;
  setSelectedLocale: (locale: TLocaleIsoCode) => void;
  setSectionOpen: (section: TVoiceSection, isOpen: boolean) => void;
};

export const useVoiceErrorReveal = ({
  fieldIdPrefix,
  setSelectedLocale,
  setSectionOpen,
}: TUseVoiceErrorRevealArgs) => {
  const [openListFieldId, setOpenListFieldId] =
    useState<TMaybeUndefined<TVoiceFieldId>>('blogListEmpty');

  const revealError = (error: TVoiceFieldError) => {
    const { locale, listFieldId } = voiceErrorReveal(error);
    setSelectedLocale(locale);
    setSectionOpen(voiceSectionOfField(error.fieldId), true);
    if (listFieldId) setOpenListFieldId(listFieldId);
  };

  const invalidControlsOf = (
    errorsInOrder: TVoiceFieldError[],
  ): TInvalidControls => {
    const [firstError] = errorsInOrder;
    return {
      ids: errorsInOrder.map(({ fieldId }) =>
        voiceFieldInputId(fieldIdPrefix, fieldId),
      ),
      revealFirst: firstError && (() => revealError(firstError)),
    };
  };

  return { openListFieldId, setOpenListFieldId, invalidControlsOf };
};
