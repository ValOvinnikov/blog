import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export const useFooterDraftFields = () => {
  const t = useTranslations('lookForm');

  return [
    {
      id: 'footerLayout',
      label: t('footerLayoutLabel'),
      display: ({ footerLayout }: TLookFormValues) =>
        t(`footerLayoutOptionLabel.${footerLayout}`),
    },
    {
      id: 'footerBackground',
      label: t('footerBackgroundLabel'),
      display: ({ footerBackground }: TLookFormValues) =>
        t(`footerBackgroundOptionLabel.${footerBackground}`),
    },
    {
      id: 'footerSurface',
      label: t('footerSurfaceLabel'),
      display: ({ footerSurface }: TLookFormValues) =>
        t(`footerSurfaceOptionLabel.${footerSurface}`),
    },
    {
      id: 'cookieSettingsButton',
      label: t('cookieSettingsButtonLabel'),
      display: ({ cookieSettingsButton }: TLookFormValues) =>
        t(`cookieSettingsButtonOptionLabel.${cookieSettingsButton}`),
    },
  ];
};
