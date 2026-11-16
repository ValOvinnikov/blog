import { SampleHeaderSubmenu } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-links/components/sample-header-submenu/sample-header-submenu';
import { ICONS, SIZE, type THeaderSubmenuStyle } from '@shinefold/config';
import type { IWithClassName } from '@shinefold/config/types';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { useTranslations } from 'next-intl';

import { sampleHeaderLinksVariants } from './sample-header-links-variants';

export type TSampleHeaderLinksProps = IWithClassName & {
  submenuStyle: THeaderSubmenuStyle;
  isSubmenuOpen: boolean;
};

export const SampleHeaderLinks = ({
  submenuStyle,
  isSubmenuOpen,
  className,
}: TSampleHeaderLinksProps) => {
  const t = useTranslations('lookPreview');
  const { root, link, submenu, trigger } = sampleHeaderLinksVariants({
    submenuStyle,
    isSubmenuOpen,
  });

  return (
    <div className={root({ class: className })}>
      <TextLink
        appearance="nav"
        href="#"
        isCurrent={true}
        currentStyle="weight"
        className={link()}
      >
        {t('navPosts')}
      </TextLink>
      <TextLink appearance="nav" href="#" className={link()}>
        {t('navAbout')}
      </TextLink>
      <div className={submenu()}>
        <span className={trigger()}>
          {t('navTopics')}
          <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} />
        </span>
        {isSubmenuOpen && <SampleHeaderSubmenu submenuStyle={submenuStyle} />}
      </div>
    </div>
  );
};
