import {
  useUploadErrorText,
  type TUploadErrorState,
} from '@platform/utils/use-upload-error-text/use-upload-error-text';
import { FORM_STATUS, type TFormStatus } from '@shinefold/config';
import { useTranslations } from 'next-intl';

type TUseLookSaveErrorsArgs = {
  status: TFormStatus;
  isPending: boolean;
  brandImageError?: TUploadErrorState;
};

export const useLookSaveErrors = ({
  status,
  isPending,
  brandImageError,
}: TUseLookSaveErrorsArgs) => {
  const t = useTranslations('lookForm');
  const uploadErrorText = useUploadErrorText();
  const fieldError = brandImageError && {
    kind: brandImageError.kind,
    message: uploadErrorText(brandImageError),
  };
  const isSaveFailed = status === FORM_STATUS.ERROR && !isPending;

  return {
    fieldError,
    errorTitle: isSaveFailed
      ? (fieldError?.message ?? t('alertError'))
      : undefined,
  };
};
