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
      display: ({ buttonColor }: TLookFormValues) =>
        buttonColor ?? t('buttonColorFollowAccent'),
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
