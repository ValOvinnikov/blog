import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  DATA_REQUEST_EXPORT_FILE_PREFIX,
  DATA_REQUEST_MATCH_KIND,
} from '@platform/constants/data-request';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_DATA_REQUEST_SITE_NAME,
  mockDataRequestMatch,
  mockPersonalDataExport,
  mockPersonalDataReaderAccount,
} from '@platform/testing/data-requests/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DataRequestPanel } from './data-request-panel';

faker.seed(5993);

const {
  lookUpPersonalDataActionMock,
  exportPersonalDataActionMock,
  erasePersonalDataActionMock,
  downloadFileMock,
} = vi.hoisted(() => ({
  lookUpPersonalDataActionMock: vi.fn(),
  exportPersonalDataActionMock: vi.fn(),
  erasePersonalDataActionMock: vi.fn(),
  downloadFileMock: vi.fn(),
}));

vi.mock('@platform/server/data-requests/look-up-personal-data-action', () => ({
  lookUpPersonalDataAction: lookUpPersonalDataActionMock,
}));

vi.mock('@platform/server/data-requests/export-personal-data-action', () => ({
  exportPersonalDataAction: exportPersonalDataActionMock,
}));

vi.mock('@platform/server/data-requests/erase-personal-data-action', () => ({
  erasePersonalDataAction: erasePersonalDataActionMock,
}));

vi.mock('@platform/utils/download-file/download-file', () => ({
  downloadFile: downloadFileMock,
}));

const {
  dataRequestSearchCard,
  dataRequestResultCard,
  dataRequestEraseDialog,
  dataRequestMatchesTable,
  dataRequestMatchKind,
  dataRequestPanel,
  dataRequestAccountCard,
  tenantFieldErrors,
} = messages;
const t = makeEnTranslator();

const EMAIL_FIELD = { name: dataRequestSearchCard.emailLabel };
const FIND_BUTTON = { name: dataRequestSearchCard.findData };
const ERASE_BUTTON = { name: dataRequestEraseDialog.erase };
const ERASE_CONFIRM_BUTTON = { name: dataRequestEraseDialog.confirm };
const EXPORT_JSON_BUTTON = { name: dataRequestResultCard.exportJson };
const EXPORT_CSV_BUTTON = { name: dataRequestResultCard.exportCsv };
const RESULTS_TABLE = { name: dataRequestMatchesTable.regionLabel };
const READER_ACCOUNT_CHECKBOX = {
  name: dataRequestEraseDialog.includesReaderAccount,
};
const EXPORT_SETTLE_TIMEOUT_MS = 5_000;
const MOCK_GENERATED_AT = '2026-10-27T10:29:42.123Z';
const EXPORT_FILE_STEM = `${DATA_REQUEST_EXPORT_FILE_PREFIX}-2026-10-27T10-29-42Z`;
const MOCK_ERASED_COUNT = 2;
const MOCK_EXPORT = {
  ...mockPersonalDataExport(),
  generatedAt: MOCK_GENERATED_AT,
};
const MOCK_BLOCK_MATCH = mockDataRequestMatch({
  key: `${DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK}-${faker.string.uuid()}`,
  kind: DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
  siteName: undefined,
  email: undefined,
});

const setup = customRender(DataRequestPanel, {});

describe(`<${DataRequestPanel.name}/>`, () => {
  let user: UserEvent;

  const lookUp = async () => {
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);
    const findButton = screen.getByRole('button', FIND_BUTTON);
    await user.type(emailField, MOCK_DATA_REQUEST_EMAIL);
    await user.click(findButton);
  };

  const exportAs = async (button: typeof EXPORT_CSV_BUTTON) => {
    const exportButton = await screen.findByRole('button', button);
    await user.click(exportButton);
    return screen.findByRole(
      'button',
      { ...button, busy: false },
      { timeout: EXPORT_SETTLE_TIMEOUT_MS },
    );
  };

  beforeEach(() => {
    user = userEvent.setup();
    lookUpPersonalDataActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [mockDataRequestMatch(), MOCK_BLOCK_MATCH],
      readerAccount: mockPersonalDataReaderAccount(),
    });
    exportPersonalDataActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      data: MOCK_EXPORT,
    });
    erasePersonalDataActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: MOCK_ERASED_COUNT,
      isReaderAccountRefused: false,
    });
    setup();
  });

  it('shows the field error for an invalid email and no results', async () => {
    lookUpPersonalDataActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
      },
    });

    await lookUp();

    const error = await screen.findByText(tenantFieldErrors.emailInvalid);
    const table = screen.queryByRole('region', RESULTS_TABLE);

    expect(error).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('says so when nothing is stored, and offers no erasure', async () => {
    lookUpPersonalDataActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [],
      readerAccount: undefined,
    });

    await lookUp();

    const summary = await screen.findByText(
      t('dataRequestResultCard.matchCount', { count: 0 }),
    );
    const empty = screen.getByText(dataRequestMatchesTable.empty);
    const eraseButton = screen.queryByRole('button', ERASE_BUTTON);

    expect(summary).toBeVisible();
    expect(empty).toBeVisible();
    expect(eraseButton).not.toBeInTheDocument();
  });

  describe('after a lookup that finds records', () => {
    beforeEach(async () => {
      await lookUp();
    });

    it('searches for the entered email and lists every match by kind and site', async () => {
      const table = await screen.findByRole('region', RESULTS_TABLE);
      const subscriberKind = within(table).getByText(
        dataRequestMatchKind.SUBSCRIBER,
      );
      const siteName = within(table).getByText(MOCK_DATA_REQUEST_SITE_NAME);
      const blockKind = within(table).getByText(
        dataRequestMatchKind.SIGNUP_BLOCK,
      );
      const hashedEmail = within(table).getByText(
        dataRequestMatchesTable.emailHashed,
      );

      expect(lookUpPersonalDataActionMock).toHaveBeenCalledWith({
        email: MOCK_DATA_REQUEST_EMAIL,
      });
      expect(subscriberKind).toBeVisible();
      expect(siteName).toBeVisible();
      expect(blockKind).toBeVisible();
      expect(hashedEmail).toBeVisible();
    });

    it('downloads the JSON export for the searched email, named by its time', async () => {
      await exportAs(EXPORT_JSON_BUTTON);

      const [, fileName, content] = downloadFileMock.mock.lastCall ?? [];

      expect(exportPersonalDataActionMock).toHaveBeenCalledWith({
        email: MOCK_DATA_REQUEST_EMAIL,
      });
      expect(fileName).toBe(`${EXPORT_FILE_STEM}.json`);
      expect(JSON.parse(content)).toEqual(
        JSON.parse(JSON.stringify(MOCK_EXPORT)),
      );
    });

    it('downloads the CSV export for the searched email, named by its time', async () => {
      await exportAs(EXPORT_CSV_BUTTON);

      const [, fileName, content] = downloadFileMock.mock.lastCall ?? [];

      expect(exportPersonalDataActionMock).toHaveBeenCalledWith({
        email: MOCK_DATA_REQUEST_EMAIL,
      });
      expect(fileName).toBe(`${EXPORT_FILE_STEM}.csv`);
      expect(content).toContain(DATA_REQUEST_MATCH_KIND.SUBSCRIBER);
    });

    it('says so when the export fails, and downloads nothing', async () => {
      exportPersonalDataActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      const exportButton = await exportAs(EXPORT_CSV_BUTTON);
      const toast = await screen.findByText(dataRequestPanel.exportFailed);

      expect(toast).toBeVisible();
      expect(exportButton).toBeEnabled();
      expect(downloadFileMock).not.toHaveBeenCalled();
    });

    it("shows the reader account's sign-in methods, sessions and bookmarks", async () => {
      const { provider } = dataRequestAccountCard;
      const providers = await screen.findByText(
        `${provider.github} and ${provider.emailLink}`,
      );
      const sessions = screen.getByText(
        t('dataRequestAccountCard.sessionCount', { count: 1 }),
      );
      const bookmarks = screen.getByText(
        t('dataRequestAccountCard.bookmarkCount', { count: 1 }),
      );

      expect(providers).toBeVisible();
      expect(sessions).toBeVisible();
      expect(bookmarks).toBeVisible();
    });

    describe('with the erase dialog open', () => {
      let dialog: HTMLElement;
      let confirmField: HTMLElement;
      let confirmButton: HTMLElement;

      const confirmErase = async () => {
        await user.type(confirmField, MOCK_DATA_REQUEST_EMAIL);
        await user.click(confirmButton);
      };

      beforeEach(async () => {
        const eraseButton = await screen.findByRole('button', ERASE_BUTTON);
        await user.click(eraseButton);
        dialog = await screen.findByRole('alertdialog');
        confirmField = within(dialog).getByRole('textbox');
        confirmButton = within(dialog).getByRole(
          'button',
          ERASE_CONFIRM_BUTTON,
        );
      });

      it('erases the reader account too unless the operator unticks it', async () => {
        const checkbox = within(dialog).getByRole(
          'checkbox',
          READER_ACCOUNT_CHECKBOX,
        );

        expect(checkbox).toBeChecked();

        await user.click(checkbox);
        await confirmErase();

        expect(erasePersonalDataActionMock).toHaveBeenCalledWith({
          email: MOCK_DATA_REQUEST_EMAIL,
          includesReaderAccount: false,
        });
      });

      it('says the sign-up block stays after an erase', () => {
        const note = within(dialog).getByText(
          dataRequestEraseDialog.signupBlockKept,
        );

        expect(note).toBeVisible();
      });

      it('explains why a reader account was kept', async () => {
        erasePersonalDataActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.SUCCESS,
          erasedCount: MOCK_ERASED_COUNT,
          isReaderAccountRefused: true,
        });

        await confirmErase();

        const toast = await screen.findByText(
          t('dataRequestPanel.erasedAccountKept', {
            count: MOCK_ERASED_COUNT,
          }),
        );

        expect(toast).toBeVisible();
      });

      it('erases only after the email is typed to confirm, then clears results', async () => {
        expect(confirmButton).toBeDisabled();

        await confirmErase();

        const toast = await screen.findByText(
          t('dataRequestPanel.erased', { count: MOCK_ERASED_COUNT }),
        );
        const table = screen.queryByRole('region', RESULTS_TABLE);

        expect(erasePersonalDataActionMock).toHaveBeenCalledWith({
          email: MOCK_DATA_REQUEST_EMAIL,
          includesReaderAccount: true,
        });
        expect(toast).toBeVisible();
        expect(table).not.toBeInTheDocument();
      });

      it('keeps the results and explains when the erasure fails', async () => {
        erasePersonalDataActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        await confirmErase();

        const error = await within(dialog).findByText(
          dataRequestPanel.eraseFailed,
        );
        const table = screen.getByRole('region', {
          ...RESULTS_TABLE,
          hidden: true,
        });

        expect(error).toBeVisible();
        expect(table).toBeVisible();
      });
    });
  });
});
