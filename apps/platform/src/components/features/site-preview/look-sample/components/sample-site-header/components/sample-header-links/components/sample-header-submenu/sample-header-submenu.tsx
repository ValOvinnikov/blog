import type { THeaderSubmenuStyle } from '@blog/config';
import {
  SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
  SAMPLE_SUBMENU_TEST_ID,
} from '@platform/constants/sample-header';
import { useTranslations } from 'next-intl';

import { sampleHeaderSubmenuVariants } from './sample-header-submenu-variants';

export type TSampleHeaderSubmenuProps = {
  submenuStyle: THeaderSubmenuStyle;
};

export const SampleHeaderSubmenu = ({
  submenuStyle,
}: TSampleHeaderSubmenuProps) => {
  const t = useTranslations('lookPreview');
  const { panel, lead, item } = sampleHeaderSubmenuVariants({ submenuStyle });

  return (
    <div
      className={panel()}
      data-testid={SAMPLE_SUBMENU_TEST_ID}
      {...{ [SAMPLE_SUBMENU_STYLE_ATTRIBUTE]: submenuStyle }}
    >
      <span className={lead()}>{t('submenuLead')}</span>
      <span className={item()}>{t('submenuFirstItem')}</span>
      <span className={item()}>{t('submenuSecondItem')}</span>
    </div>
  );
};
