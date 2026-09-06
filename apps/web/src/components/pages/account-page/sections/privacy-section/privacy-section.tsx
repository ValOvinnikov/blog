import { routes } from '@blog/config';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { Panel } from '@blog/ui/molecules/panel';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';
import { SmartLink } from '@web/components/shared/smart-link';

export interface IPrivacySectionProps {
  handle: string;
  heading: string;
  exportLabel: string;
  exportDescription: string;
  exportButton: string;
  deleteLabel: string;
  deleteDescription: string;
}

/**
 * PrivacySection — pure, prop-driven: the `/account` "privacy & data"
 * export/delete panel. Needs no wrapper/view split since it does no data
 * fetching of its own; `AccountPage` resolves the session-derived `handle`
 * and every translated string and passes them straight in.
 */
export const PrivacySection = ({
  handle,
  heading,
  exportLabel,
  exportDescription,
  exportButton,
  deleteLabel,
  deleteDescription,
}: IPrivacySectionProps) => (
  <Panel>
    <Panel.Header headingLevel={2}>{heading}</Panel.Header>
    <Panel.Body>
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
    </Panel.Body>
  </Panel>
);
