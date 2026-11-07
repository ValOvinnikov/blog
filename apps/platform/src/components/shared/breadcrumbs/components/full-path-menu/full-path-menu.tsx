'use client';

import { Menu } from '@base-ui/react/menu';
import type { TMaybeNull } from '@blog/config';
import { hasLength } from '@blog/utils/primitives';
import type { TBreadcrumbItem } from '@platform/components/shared/breadcrumbs/breadcrumbs';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { Link } from '@platform/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { fullPathMenuVariants } from './full-path-menu-variants';
import { groupCrumbs, type TCrumbLink } from './group-crumbs';

export type TFullPathMenuProps = {
  items: TBreadcrumbItem[];
};

export const FullPathMenu = ({ items }: TFullPathMenuProps) => {
  const t = useTranslations('topbar');
  const firstLinkRef = useRef<TMaybeNull<HTMLAnchorElement>>(null);
  const groups = groupCrumbs(items);
  const firstLink = groups.find(({ links }) => hasLength(links))?.links[0];
  const { trigger, popup } = fullPathMenuVariants();
  const {
    positioner,
    popup: surfacePopup,
    item,
    groupLabel,
  } = menuSurfaceVariants();

  const handleOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen) {
      firstLinkRef.current?.focus();
    }
  };

  const renderLink = (link: TCrumbLink) => (
    <Menu.LinkItem
      key={link.href}
      ref={link === firstLink ? firstLinkRef : undefined}
      closeOnClick={true}
      className={item()}
      render={<Link href={link.href} />}
    >
      {link.label}
    </Menu.LinkItem>
  );

  return (
    <Menu.Root onOpenChangeComplete={handleOpenChangeComplete}>
      <Menu.Trigger aria-label={t('showFullPath')} className={trigger()}>
        …
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="start"
          sideOffset={7}
          className={positioner()}
        >
          <Menu.Popup
            aria-label={t('fullPathMenuLabel')}
            className={surfacePopup({ class: popup() })}
          >
            {groups.map(({ label, links }) =>
              label ? (
                <Menu.Group key={label}>
                  <Menu.GroupLabel className={groupLabel()}>
                    {label}
                  </Menu.GroupLabel>
                  {links.map(renderLink)}
                </Menu.Group>
              ) : (
                links.map(renderLink)
              ),
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
