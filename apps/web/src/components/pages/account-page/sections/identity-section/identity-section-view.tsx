import { Heading } from '@blog/ui/atoms/heading';
import { Panel } from '@blog/ui/molecules/panel';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import type { ReactNode } from 'react';

import { identitySectionVariants } from './identity-section-variants';

const s = identitySectionVariants();

export interface IIdentityProviderRow {
  id: 'github' | 'google' | 'email';
  icon: ReactNode;
  label: string;
  isLinked: boolean;
  isLastMethod: boolean;
  linkedStatusLabel: string;
  lastMethodNoticeLabel: string;
  control: ReactNode;
}

export interface IIdentitySectionViewProps {
  heading: string;
  providerRows: IIdentityProviderRow[];
  displayNameLabel: string;
  displayNameDescription: string;
  displayNameControl: ReactNode;
}

/**
 * Pure view for `IdentitySection`: the connected-accounts panel (provider
 * rows + display-name control). Each row and the display-name control
 * arrive already resolved by the wrapper — this component has no knowledge
 * of the session, `@blog/db`, or translations.
 */
export const IdentitySectionView = ({
  heading,
  providerRows,
  displayNameLabel,
  displayNameDescription,
  displayNameControl,
}: IIdentitySectionViewProps) => (
  <Panel>
    <Panel.Header headingLevel={2}>{heading}</Panel.Header>
    <Panel.Body>
      {providerRows.map(
        ({
          id,
          icon,
          label,
          isLinked,
          isLastMethod,
          linkedStatusLabel,
          lastMethodNoticeLabel,
          control,
        }) => (
          <div key={id} className={s.providerRow()}>
            <Heading level={3} visual="copy" className={s.providerName()}>
              {icon} {label}
            </Heading>
            <div className={s.providerStatus()}>
              {isLinked && (
                <span className={s.linkedStatus()}>{linkedStatusLabel}</span>
              )}
              {isLastMethod ? (
                <span className={s.lastMethodNotice()}>
                  {lastMethodNoticeLabel}
                </span>
              ) : (
                control
              )}
            </div>
          </div>
        ),
      )}
      <SettingRow label={displayNameLabel} description={displayNameDescription}>
        {displayNameControl}
      </SettingRow>
    </Panel.Body>
  </Panel>
);
