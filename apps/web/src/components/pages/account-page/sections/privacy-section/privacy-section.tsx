import { Panel } from '@shinefold/ui/components/molecules/panel';
import { SettingRow } from '@shinefold/ui/components/molecules/setting-row';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';

import { ExportAccountDataControl } from './components/export-account-data-control/export-account-data-control';

export interface IPrivacySectionProps {
  handle: string;
  heading: string;
  exportLabel: string;
  exportDescription: string;
  deleteLabel: string;
  deleteDescription: string;
}

export const PrivacySection = ({
  handle,
  heading,
  exportLabel,
  exportDescription,
  deleteLabel,
  deleteDescription,
}: IPrivacySectionProps) => (
  <Panel>
    <Panel.Header headingLevel={2}>{heading}</Panel.Header>
    <Panel.Body>
      <SettingRow label={exportLabel} description={exportDescription}>
        <ExportAccountDataControl />
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
