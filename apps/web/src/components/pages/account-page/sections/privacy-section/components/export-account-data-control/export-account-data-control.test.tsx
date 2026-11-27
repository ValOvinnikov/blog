import { HTTP_STATUS, routes, SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ACCOUNT_EXPORT_FILE_NAME } from '@web/constants/account';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { withToastProvider } from '@web/testing/providers';
import { ARIA_BUSY, ARIA_DISABLED } from '@web/testing/shared/aria/constants';
import { respondWith } from '@web/testing/shared/fetch/respond-with';
import { findToastStatus } from '@web/testing/shared/toast/find-toast-status';
import type { MockInstance } from 'vitest';

import { ExportAccountDataControl } from './export-account-data-control';

const {
  exportButton: EXPORT_BUTTON_LABEL,
  exportToastSuccessMessage: SUCCESS_MESSAGE,
  exportError: ERROR_MESSAGE,
} = SITE_MESSAGES.accountPage.privacy;

const MOCK_OBJECT_URL = 'blob:account-data';
const { createObjectURL, revokeObjectURL } = URL;

const setup = customRender(withToastProvider(ExportAccountDataControl), {});

describe(`<${ExportAccountDataControl.name}/>`, () => {
  let user: UserEvent;
  let clickMock: MockInstance<() => void>;

  const getExportButton = () =>
    screen.getByRole('button', { name: EXPORT_BUTTON_LABEL });

  beforeEach(() => {
    user = userEvent.setup();
    clickMock = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    URL.createObjectURL = vi.fn().mockReturnValue(MOCK_OBJECT_URL);
    URL.revokeObjectURL = vi.fn();
    setup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  it('saves the export as a file and announces it once', async () => {
    const fetchMock = respondWith(HTTP_STATUS.OK, {});
    vi.stubGlobal('fetch', fetchMock);

    await user.click(getExportButton());

    const successToast = await findToastStatus();
    expect(successToast).toHaveTextContent(SUCCESS_MESSAGE);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(routes.accountExport());
    expect(clickMock).toHaveBeenCalledOnce();
    expect(clickMock.mock.contexts[0]).toMatchObject({
      download: ACCOUNT_EXPORT_FILE_NAME,
    });
    const successMessages = screen.getAllByText(SUCCESS_MESSAGE);
    expect(successMessages).toHaveLength(1);
  });

  it('marks the button busy while the export is prepared', async () => {
    let resolveExport!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveExport = resolve;
          }),
      ),
    );
    const exportButton = getExportButton();

    await user.click(exportButton);

    expect(exportButton).toHaveAttribute(ARIA_BUSY, 'true');
    expect(exportButton).toHaveAttribute(ARIA_DISABLED);

    resolveExport(new Response(null, { status: HTTP_STATUS.OK }));

    await waitFor(() => {
      expect(exportButton).not.toHaveAttribute(ARIA_BUSY);
    });
  });

  it('shows the error, saves nothing and re-enables the button on failure', async () => {
    vi.stubGlobal('fetch', respondWith(HTTP_STATUS.INTERNAL_SERVER_ERROR));
    const exportButton = getExportButton();

    await user.click(exportButton);

    const errorToast = await screen.findByRole('alert');
    expect(errorToast).toHaveTextContent(ERROR_MESSAGE);
    expect(clickMock).not.toHaveBeenCalled();
    expect(exportButton).not.toHaveAttribute(ARIA_DISABLED);
  });
});
