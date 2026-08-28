import { Heading } from '@blog/ui/atoms/heading';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { PlainSection } from '@web/components/shared/plain-section';
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
  isChromeOn: boolean;
  handle: string;
  promptHost: string;
  promptCommand: string;
  providerRows: IIdentityProviderRow[];
  displayNameLabel: string;
  displayNameDescription: string;
  displayNameControl: ReactNode;
}

/**
 * Pure view for `IdentitySection`: the connected-accounts window (provider
 * rows + display-name control). Each row and the display-name control
 * arrive already resolved by the wrapper — this component has no knowledge
 * of the session, `@blog/db`, or translations.
 */
export const IdentitySectionView = ({
  isChromeOn,
  handle,
  promptHost,
  promptCommand,
  providerRows,
  displayNameLabel,
  displayNameDescription,
  displayNameControl,
}: IIdentitySectionViewProps) => {
  const bodyContent = (
    <>
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
    </>
  );

  if (!isChromeOn) {
    return (
      <PlainSection heading={promptCommand} headingLevel={2}>
        {bodyContent}
      </PlainSection>
    );
  }

  return (
    <WindowChrome>
      <WindowChrome.Bar headingLevel={2}>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{promptHost}</WindowChrome.Prompt> {promptCommand}
      </WindowChrome.Bar>
      <WindowChrome.Body>{bodyContent}</WindowChrome.Body>
    </WindowChrome>
  );
};
