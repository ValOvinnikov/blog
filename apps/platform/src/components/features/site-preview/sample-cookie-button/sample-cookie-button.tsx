import { ICONS } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import { SAMPLE_COOKIE_BUTTON_TEST_ID } from '@platform/constants/sample-footer';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { sampleCookieButtonVariants } from './sample-cookie-button-variants';

export type TSampleCookieButtonProps = {
  theme: TSitePreviewTheme;
};

export const SampleCookieButton = ({ theme }: TSampleCookieButtonProps) => {
  const t = useTranslations('lookPreview');
  const { root, button, icon } = sampleCookieButtonVariants();
  const label = t('footerCookieSettings');

  return (
    <SiteThemeFrame
      theme={theme}
      className={root()}
      testId={SAMPLE_COOKIE_BUTTON_TEST_ID}
    >
      <div aria-hidden={true}>
        <IconButton variant="circle" ariaLabel={label} className={button()}>
          <Icon name={ICONS.COOKIE} className={icon()} />
        </IconButton>
      </div>
    </SiteThemeFrame>
  );
};
