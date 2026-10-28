import { ICONS, SIZE, type THeaderSubmenuStyle } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { SampleHeaderSubmenu } from '@platform/components/features/site-preview/look-sample/components/sample-site-header/components/sample-header-links/components/sample-header-submenu/sample-header-submenu';
import { useTranslations } from 'next-intl';

import { sampleHeaderLinksVariants } from './sample-header-links-variants';

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
