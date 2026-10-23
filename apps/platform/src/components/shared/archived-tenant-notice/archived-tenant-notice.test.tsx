import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
} from '@platform/testing/render-in-settings-form';
import { MOCK_ARCHIVED_AT } from '@platform/testing/tenants/fixtures';

import { ArchivedTenantNotice } from './archived-tenant-notice';

describe(`<${ArchivedTenantNotice.name}/>`, () => {
  it('renders a status-role notice naming the archive date', () => {
    renderWithIntl(<ArchivedTenantNotice archivedAt={MOCK_ARCHIVED_AT} />);

    const notice = screen.getByRole('status');
    const noticeText = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const archiveDate = screen.getByText(/Aug 26, 2026/);

    expect(notice).toBeVisible();
    expect(noticeText).toBeVisible();
    expect(archiveDate).toBeVisible();
  });

  it('forwards an id, so a disabled control elsewhere can reference it via aria-describedby', () => {
    renderWithIntl(
      <ArchivedTenantNotice
        id={ARCHIVED_NOTICE_ID}
        archivedAt={MOCK_ARCHIVED_AT}
      />,
    );

    const notice = screen.getByRole('status');

    expect(notice).toHaveAttribute('id', ARCHIVED_NOTICE_ID);
  });
});
