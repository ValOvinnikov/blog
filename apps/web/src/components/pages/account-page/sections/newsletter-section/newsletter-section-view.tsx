import { SUBSCRIBER_STATUS, type TSubscriberStatus } from '@blog/db/constants';
import { StatusBadge } from '@blog/ui/components/atoms/status-badge';
import { Panel } from '@blog/ui/components/molecules/panel';
import { SettingRow } from '@blog/ui/components/molecules/setting-row';
import type { ReactNode } from 'react';

import { newsletterSectionVariants } from './newsletter-section-variants';

const s = newsletterSectionVariants();

export interface INewsletterSectionViewProps {
  heading: string;
  status: TSubscriberStatus;
  label: string;
  email: string;
  activeBadgeLabel: string;
  activeDescriptionPrefix: string;
  activeDescriptionSuffix: string;
  pendingBadgeLabel: string;
  pendingDescription: string;
  control: ReactNode;
}

export const NewsletterSectionView = ({
  heading,
  status,
  label,
  email,
  activeBadgeLabel,
  activeDescriptionPrefix,
  activeDescriptionSuffix,
  pendingBadgeLabel,
  pendingDescription,
  control,
}: INewsletterSectionViewProps) => {
  const settingRow =
    status === SUBSCRIBER_STATUS.ACTIVE ? (
      <SettingRow
        label={
          <>
            {label} <StatusBadge tone="ok">{activeBadgeLabel}</StatusBadge>
          </>
        }
        description={
          <>
            {activeDescriptionPrefix} <span className={s.email()}>{email}</span>{' '}
            {activeDescriptionSuffix}
          </>
        }
      >
        {control}
      </SettingRow>
    ) : (
      <SettingRow
        label={
          <>
            {label} <StatusBadge tone="warn">{pendingBadgeLabel}</StatusBadge>
          </>
        }
        description={pendingDescription}
      >
        {control}
      </SettingRow>
    );

  return (
    <Panel>
      <Panel.Header headingLevel={2}>{heading}</Panel.Header>
      <Panel.Body>{settingRow}</Panel.Body>
    </Panel>
  );
};
