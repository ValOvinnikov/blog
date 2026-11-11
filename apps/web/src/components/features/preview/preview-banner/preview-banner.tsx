import type { TLocaleIsoCode } from '@blog/config';
import { useTranslations } from 'next-intl';

import { PreviewExitLink } from './components/preview-exit-link/preview-exit-link';
import { previewBannerVariants } from './preview-banner-variants';

type TPreviewBannerProps = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const PreviewBanner = ({
  locale,
  defaultLocale,
}: TPreviewBannerProps) => {
  const t = useTranslations('previewBanner');

  return (
    <div className={previewBannerVariants()} data-testid="preview-banner">
      <p>{t('message')}</p>
      <PreviewExitLink
        label={t('exitLabel')}
        locale={locale}
        defaultLocale={defaultLocale}
      />
    </div>
  );
};
