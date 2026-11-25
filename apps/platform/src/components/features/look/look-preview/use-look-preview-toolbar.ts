import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LOCKED_PREVIEW_MODE } from '@platform/constants/preview';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';

import { useReaderGroup } from './use-reader-group';

export const useLookPreviewToolbar = (hasReaderAccounts: boolean) => {
  const {
    previewDevice,
    setPreviewDevice,
    values: { colorMode },
  } = useLookForm();
  const { isDark, ...colorScheme } = usePreviewColorScheme(
    LOCKED_PREVIEW_MODE[colorMode],
  );
  const { readerGroup, isSignedIn } = useReaderGroup();

  return {
    toolbarProps: {
      device: previewDevice,
      onDeviceChange: setPreviewDevice,
      colorScheme,
      extraGroups: hasReaderAccounts ? [readerGroup] : [],
    },
    isDark,
    isSignedIn,
  };
};
