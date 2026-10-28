import {
  HEADER_SUBMENU_STYLE,
  ICONS,
  SIZE,
  type THeaderSubmenuStyle,
} from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { SampleHeaderSubmenu } from '@platform/components/features/site-preview/look-sample/components/sample-site-header/components/sample-header-links/components/sample-header-submenu/sample-header-submenu';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const sampleHeaderLinksVariants = tv({
  slots: {
    root: ['flex items-center gap-4'],
    submenu: ['inline-flex items-center'],
    trigger: ['inline-flex items-center gap-1 font-mono text-meta text-muted'],
  },
  variants: {
    submenuStyle: {
      [HEADER_SUBMENU_STYLE.DROPDOWN]: { submenu: ['relative'] },
      [HEADER_SUBMENU_STYLE.WIDE_PANEL]: { submenu: [] },
    },
  },
});

export type TSampleHeaderLinksProps = IWithClassName & {
  submenuStyle: THeaderSubmenuStyle;
};

export const SampleHeaderLinks = ({
  submenuStyle,
  className,
}: TSampleHeaderLinksProps) => {
  const t = useTranslations('lookPreview');
  const { root, submenu, trigger } = sampleHeaderLinksVariants({
    submenuStyle,
  });

  return (
    <div className={root({ class: className })}>
      <TextLink appearance="nav" href="#" isCurrent={true}>
        {t('navPosts')}
      </TextLink>
      <TextLink appearance="nav" href="#">
        {t('navAbout')}
      </TextLink>
      <div className={submenu()}>
        <span className={trigger()}>
          {t('navTopics')}
          <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} />
        </span>
        <SampleHeaderSubmenu submenuStyle={submenuStyle} />
      </div>
    </div>
  );
};
