import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { Panel } from '@blog/ui/molecules/panel';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import type { ReactNode } from 'react';

import { newsletterSectionVariants } from './newsletter-section-variants';

const s = newsletterSectionVariants();

export interface INewsletterSectionViewProps {
  heading: string;
  status: 'active' | 'pending';
  label: string;
  email: string;
  activeBadgeLabel: string;
  activeDescriptionPrefix: string;
  activeDescriptionSuffix: string;
  pendingBadgeLabel: string;
  pendingDescription: string;
  control: ReactNode;
}

/**
 * Pure view for `NewsletterSection`: the active/pending subscription
 * `SettingRow`. Whether the section renders at all (not-subscribed, no
 * tenant, signed out) is the wrapper's own business call — this component
 * only ever receives an already-decided `active`/`pending` state.
 */
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
    status === 'active' ? (
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
