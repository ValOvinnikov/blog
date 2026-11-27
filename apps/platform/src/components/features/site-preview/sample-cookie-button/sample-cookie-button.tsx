import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import { SAMPLE_COOKIE_BUTTON_TEST_ID } from '@platform/constants/sample-footer';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { ICONS } from '@shinefold/config';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { IconButton } from '@shinefold/ui/components/atoms/icon-button';
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
        <SamplePart part={SAMPLE_PART.COOKIE_BUTTON}>
          <IconButton variant="circle" ariaLabel={label} className={button()}>
            <Icon name={ICONS.COOKIE} className={icon()} />
          </IconButton>
        </SamplePart>
      </div>
    </SiteThemeFrame>
  );
};
