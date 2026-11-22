import { faker } from '@faker-js/faker';
import { exportSubscribersAction } from '@platform/server/subscribers/export-subscribers-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { downloadFile } from '@platform/utils/download-file/download-file';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ExportSubscribersButton } from './export-subscribers-button';

faker.seed(7164);

vi.mock('@platform/server/subscribers/export-subscribers-action', () => ({
  exportSubscribersAction: vi.fn(),
}));
vi.mock('@platform/utils/download-file/download-file');

const t = makeEnTranslator('subscribersPage');
const MOCK_EXPORT = {
  fileName: faker.system.fileName(),
  csv: faker.lorem.lines(2),
};

const setup = customRender(ExportSubscribersButton, {
  tenantId: MOCK_TENANT_ID,
  isEmpty: false,
});

describe(`<${ExportSubscribersButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it("downloads the site's list as the file the server named", async () => {
    vi.mocked(exportSubscribersAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      data: MOCK_EXPORT,
    });
    setup();

    const exportButton = screen.getByRole('button', { name: t('export') });
    await user.click(exportButton);

    expect(exportSubscribersAction).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
    expect(downloadFile).toHaveBeenCalledExactlyOnceWith(
      expect.any(HTMLAnchorElement),
      MOCK_EXPORT.fileName,
      MOCK_EXPORT.csv,
    );
  });

  it('says the export failed and downloads nothing', async () => {
    vi.mocked(exportSubscribersAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    const exportButton = screen.getByRole('button', { name: t('export') });
    await user.click(exportButton);

    const toast = await screen.findByText(t('exportFailed'));

    expect(toast).toBeVisible();
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it('cannot export an empty list', () => {
    setup({ isEmpty: true });

    const button = screen.getByRole('button', { name: t('export') });

    expect(button).toBeDisabled();
  });
});
