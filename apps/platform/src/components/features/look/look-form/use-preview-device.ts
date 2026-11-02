import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { useEffect, useState } from 'react';

export const usePreviewDevice = () => {
  const [previewDevice, setPreviewDevice] = useState<TPreviewDevice>(
    PREVIEW_DEVICE.PHONE,
  );

  useEffect(() => {
    if (window.matchMedia(MEDIA_QUERY.LG_UP).matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-time read on mount; the server render has no window, and a later resize must not change it
      setPreviewDevice(PREVIEW_DEVICE.DESKTOP);
    }
  }, []);

  return { previewDevice, setPreviewDevice };
};
