import { routes } from '@blog/config';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';
import { PlainSection } from '@web/components/shared/plain-section';
import { SmartLink } from '@web/components/shared/smart-link';

export interface IPrivacySectionProps {
  handle: string;
  isChromeOn: boolean;
  promptHost: string;
  promptCommand: string;
  promptTag: string;
  exportLabel: string;
  exportDescription: string;
  exportButton: string;
  deleteLabel: string;
  deleteDescription: string;
}

/**
 * PrivacySection — pure, prop-driven: the `/account` "privacy & data"
 * export/delete window. Needs no wrapper/view split since it does no data
 * fetching of its own; `AccountPage` resolves the session-derived `handle`
 * and every translated string and passes them straight in.
 */
export const PrivacySection = ({
  handle,
  isChromeOn,
  promptHost,
  promptCommand,
  promptTag,
  exportLabel,
  exportDescription,
  exportButton,
  deleteLabel,
  deleteDescription,
}: IPrivacySectionProps) => {
  const bodyContent = (
    <>
      <SettingRow label={exportLabel} description={exportDescription}>
        <LinkButton
          as={SmartLink}
          href={routes.accountExport()}
          prefetch={false}
          download={true}
          variant="ghost"
        >
          {exportButton}
        </LinkButton>
      </SettingRow>
      <SettingRow
        tone="danger"
        label={deleteLabel}
        description={deleteDescription}
      >
        <DeleteAccountControl handle={handle} />
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
        <WindowChrome.Tag>{promptTag}</WindowChrome.Tag>
      </WindowChrome.Bar>
      <WindowChrome.Body>{bodyContent}</WindowChrome.Body>
    </WindowChrome>
  );
};
