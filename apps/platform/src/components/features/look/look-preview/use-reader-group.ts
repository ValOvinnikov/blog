import { ICONS } from '@blog/config';
import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import {
  PREVIEW_READER_STATE,
  type TPreviewReaderState,
} from '@platform/constants/preview';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const useReaderGroup = () => {
  const t = useTranslations('lookPreview');
  const [readerState, setReaderState] = useState<TPreviewReaderState>(
    PREVIEW_READER_STATE.SIGNED_OUT,
  );

  const readerGroup: TIconToggleGroupProps<TPreviewReaderState> = {
    ariaLabel: t('readerStateAriaLabel'),
    value: readerState,
    onChange: setReaderState,
    options: [
      {
        value: PREVIEW_READER_STATE.SIGNED_OUT,
        icon: ICONS.USER,
        ariaLabel: t('readerSignedOut'),
        tooltip: t('readerSignedOut'),
      },
      {
        value: PREVIEW_READER_STATE.SIGNED_IN,
        icon: ICONS.USER_CHECK,
        ariaLabel: t('readerSignedIn'),
        tooltip: t('readerSignedInTooltip', { name: t('sampleReaderName') }),
        isTooltipEndAligned: true,
      },
    ],
  };

  return {
    readerGroup,
    isSignedIn: readerState === PREVIEW_READER_STATE.SIGNED_IN,
  };
};
