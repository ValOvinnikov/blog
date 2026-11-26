import { buttonColorFollowKey } from '@platform/utils/button-colors/button-colors';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export const useButtonsDraftFields = () => {
  const t = useTranslations('lookForm');

  return [
    {
      id: 'buttonShape',
      label: t('buttonShapeLabel'),
      display: ({ buttonShape }: TLookFormValues) =>
        t(`buttonShapeOptionLabel.${buttonShape}`),
    },
    {
      id: 'buttonColor',
      label: t('buttonColorLabel'),
      display: ({ preset, buttonColor }: TLookFormValues) =>
        buttonColor ?? t(buttonColorFollowKey(preset)),
    },
    {
      id: 'buttonColorDark',
      label: t('buttonColorDarkLabel'),
      display: ({ buttonColorDark }: TLookFormValues) =>
        buttonColorDark ?? t('buttonColorDarkFollow'),
    },
    {
      id: 'busyButtonStyle',
      label: t('busyButtonStyleLabel'),
      display: ({ busyButtonStyle }: TLookFormValues) =>
        t(`busyButtonStyleOptionLabel.${busyButtonStyle}`),
    },
    {
      id: 'spinnerStyle',
      label: t('spinnerStyleLabel'),
      display: ({ spinnerStyle }: TLookFormValues) =>
        t(`spinnerStyleOptionLabel.${spinnerStyle}`),
    },
  ];
};
