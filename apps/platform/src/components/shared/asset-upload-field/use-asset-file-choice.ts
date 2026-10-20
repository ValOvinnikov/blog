import type { TMaybeUndefined } from '@blog/config';
import {
  createStagingHandlers,
  type TStagedImage,
} from '@platform/utils/staged-image/staged-image';
import { type ChangeEvent, useState } from 'react';

type TUseAssetFileChoiceArgs = {
  onStage: (image: TStagedImage) => void;
  validateFile: (file: File) => TMaybeUndefined<string>;
};

export const useAssetFileChoice = ({
  onStage,
  validateFile,
}: TUseAssetFileChoiceArgs) => {
  const [validationError, setValidationError] =
    useState<TMaybeUndefined<string>>(undefined);
  const { onPick, onClear } = createStagingHandlers(onStage);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const fileError = validateFile(file);
    setValidationError(fileError);
    if (!fileError) onPick(file);
  };

  const handleRemove = () => {
    setValidationError(undefined);
    onClear();
  };

  return { validationError, handleFileChange, handleRemove };
};
