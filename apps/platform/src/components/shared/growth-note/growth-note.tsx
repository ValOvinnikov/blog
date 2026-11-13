'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ALERT_TYPE, ICONS, SIZE } from '@blog/config';
import { buttonVariants } from '@platform/components/shared/button/button-variants';
import { GrowthBadge } from '@platform/components/shared/growth-badge';
import { Icon, STATUS_ICON } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import {
  GrowthNoteItem,
  type TGrowthNoteItem,
} from './components/growth-note-item/growth-note-item';
import { growthNoteVariants } from './growth-note-variants';

export type TGrowthNoteProps = {
  items: readonly TGrowthNoteItem[];
  closingLine?: string;
};

export const GrowthNote = ({ items, closingLine }: TGrowthNoteProps) => {
  const t = useTranslations('growthNote');
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const {
    root,
    row,
    icon,
    text,
    title,
    description,
    chevron,
    panel,
    list,
    closing,
  } = growthNoteVariants();

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      role="note"
      className={root()}
    >
      <div className={row()}>
        <Icon name={STATUS_ICON[ALERT_TYPE.INFO]} className={icon()} />
        <div className={text()}>
          <strong className={title()}>{t('title')}</strong>
          <div className={description()}>
            {t.rich('description', { badge: () => <GrowthBadge /> })}
          </div>
        </div>
        <Collapsible.Trigger
          aria-controls={panelId}
          className={buttonVariants({ size: SIZE.SM }).root()}
        >
          {isOpen ? t('hide') : t('show')}
          <Icon
            name={isOpen ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN}
            size={ICON_SIZE.SM}
            className={chevron()}
          />
        </Collapsible.Trigger>
        <LinkButton
          href={adminRoutes.dashboardUpgrade()}
          variant={BUTTON_VARIANT.PRIMARY}
          size={SIZE.SM}
        >
          {t('askAboutGrowth')}
        </LinkButton>
      </div>
      <Collapsible.Panel id={panelId} keepMounted={true} className={panel()}>
        <ul aria-label={t('listLabel')} className={list()}>
          {items.map((item) => (
            <GrowthNoteItem key={item.id} item={item} />
          ))}
        </ul>
        {closingLine && <p className={closing()}>{closingLine}</p>}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};
