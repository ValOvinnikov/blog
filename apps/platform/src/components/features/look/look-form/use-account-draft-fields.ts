import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export const useAccountDraftFields = () => {
  const t = useTranslations('lookForm');

  return [
    {
      id: 'accountButtonStyle',
      label: t('accountButtonStyleLabel'),
      display: ({ accountButtonStyle }: TLookFormValues) =>
        t(`accountButtonStyleOptionLabel.${accountButtonStyle}`),
    },
    {
      id: 'accountPanelStyle',
      label: t('accountPanelStyleLabel'),
      display: ({ accountPanelStyle }: TLookFormValues) =>
        t(`accountPanelStyleOptionLabel.${accountPanelStyle}`),
    },
    {
      id: 'accountPhonePlacement',
      label: t('accountPhonePlacementLabel'),
      display: ({ accountPhonePlacement }: TLookFormValues) =>
        t(`accountPhonePlacementOptionLabel.${accountPhonePlacement}`),
    },
  ];
};
