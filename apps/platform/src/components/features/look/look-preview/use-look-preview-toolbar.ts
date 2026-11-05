import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';

import { useReaderGroup } from './use-reader-group';

export const useLookPreviewToolbar = (hasReaderAccounts: boolean) => {
  const { previewDevice, setPreviewDevice } = useLookForm();
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const { readerGroup, isSignedIn } = useReaderGroup();

  return {
    toolbarProps: {
      device: previewDevice,
      onDeviceChange: setPreviewDevice,
      mode,
      onModeChange: setMode,
      extraGroups: hasReaderAccounts ? [readerGroup] : [],
    },
    isDark,
    isSignedIn,
  };
};
