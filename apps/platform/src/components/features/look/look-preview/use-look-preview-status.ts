import { useLookPresetName } from '@platform/components/features/look/look-form/use-look-preset-name';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';

import { useLookFollowStatus } from './components/look-follow-status';
import type { TLookFollow } from './use-look-follow';

type TLookPreviewStatusInput = {
  follow: TLookFollow;
  target: TLookFollowTarget;
  device: TPreviewDevice;
  isPhoneTab: boolean;
  hasReaderAccounts: boolean;
};

export const useLookPreviewStatus = ({
  follow,
  target,
  device,
  isPhoneTab,
  hasReaderAccounts,
}: TLookPreviewStatusInput) => {
  const { hasLockedFields } = useLookForm();
  const t = useTranslations('lookPreview');
  const tFollow = useTranslations('lookFollow');
  const presetName = useLookPresetName();

  return useLookFollowStatus({
    follow,
    target,
    device,
    isShortLine: isPhoneTab || !hasReaderAccounts,
    readerNote: hasReaderAccounts ? undefined : t('readerAccountsOff'),
    planNote: hasLockedFields
      ? tFollow('freeSample', { preset: presetName })
      : undefined,
  });
};
