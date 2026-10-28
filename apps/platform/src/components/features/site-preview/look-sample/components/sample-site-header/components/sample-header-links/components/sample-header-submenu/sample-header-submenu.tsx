import { HEADER_SUBMENU_STYLE, type THeaderSubmenuStyle } from '@blog/config';
import {
  SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
  SAMPLE_SUBMENU_TEST_ID,
} from '@platform/constants/sample-header';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const sampleHeaderSubmenuVariants = tv({
  slots: {
    panel: [
      'absolute z-10 flex flex-col bg-surface text-text shadow-float',
      'border border-border font-display text-xs',
    ],
    lead: ['font-semibold'],
    item: ['text-muted'],
  },
  variants: {
    submenuStyle: {
      [HEADER_SUBMENU_STYLE.DROPDOWN]: {
        panel: ['top-full left-0 mt-2 w-40 gap-1.5 rounded-card p-2.5'],
      },
      [HEADER_SUBMENU_STYLE.WIDE_PANEL]: {
        panel: [
          'inset-x-0 top-full flex-row items-start gap-8',
          'rounded-b-card border-t-0 px-3 py-3',
        ],
      },
    },
  },
});

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
