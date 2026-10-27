import { ACTION_OUTCOME } from '@blog/config';
import {
  DATA_REQUEST_EXPORT_FILE_NAME,
  DATA_REQUEST_MATCH_KIND,
} from '@platform/constants/data-request';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_DATA_REQUEST_SITE_NAME,
  mockDataRequestMatch,
  mockPersonalDataExport,
  mockPersonalDataReaderAccount,
} from '@platform/testing/data-requests/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DataRequestPanel } from './data-request-panel';

const {
  lookUpPersonalDataActionMock,
  exportPersonalDataActionMock,
  erasePersonalDataActionMock,
  downloadJsonMock,
} = vi.hoisted(() => ({
  lookUpPersonalDataActionMock: vi.fn(),
  exportPersonalDataActionMock: vi.fn(),
  erasePersonalDataActionMock: vi.fn(),
  downloadJsonMock: vi.fn(),
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

vi.mock('@platform/utils/download-json/download-json', () => ({
  downloadJson: downloadJsonMock,
}));

const EMAIL_FIELD = { name: 'Email address' };
const FIND_BUTTON = { name: 'Find data' };
const ERASE_BUTTON = { name: 'Erase' };
const ERASE_CONFIRM_BUTTON = { name: 'Erase data' };
const EXPORT_BUTTON = { name: 'Download export' };
const RESULTS_TABLE = { name: 'Stored records' };
const READER_ACCOUNT_CHECKBOX = { name: 'Also delete the reader account' };
const SIGNUP_BLOCK_KEPT =
  'The sign-up block stays: it holds only a hash of the address and keeps it blocked.';
const ERASED = { outcome: ACTION_OUTCOME.SUCCESS, erasedCount: 2 };
const BLOCK_MATCH = mockDataRequestMatch({
  key: 'SIGNUP_BLOCK-block-1',
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

  const openEraseDialog = async () => {
    const eraseButton = await screen.findByRole('button', ERASE_BUTTON);
    await user.click(eraseButton);
    const dialog = await screen.findByRole('alertdialog');
    const confirmField = within(dialog).getByRole('textbox');
    const confirmButton = within(dialog).getByRole(
      'button',
      ERASE_CONFIRM_BUTTON,
    );
    return { dialog, confirmField, confirmButton };
  };

  beforeEach(() => {
    user = userEvent.setup();
    lookUpPersonalDataActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [mockDataRequestMatch(), BLOCK_MATCH],
      readerAccount: mockPersonalDataReaderAccount(),
    });
    exportPersonalDataActionMock.mockReset();
    erasePersonalDataActionMock.mockReset();
    downloadJsonMock.mockReset();
    setup();
  });

  it('searches for the entered email and lists every match by kind and site', async () => {
    await lookUp();

    const table = await screen.findByRole('region', RESULTS_TABLE);
    const subscriberKind = within(table).getByText('Subscriber');
    const siteName = within(table).getByText(MOCK_DATA_REQUEST_SITE_NAME);
    const blockKind = within(table).getByText('Sign-up block');
    const hashedEmail = within(table).getByText('Stored as a hash');

    expect(lookUpPersonalDataActionMock).toHaveBeenCalledWith({
      email: MOCK_DATA_REQUEST_EMAIL,
    });
    expect(subscriberKind).toBeVisible();
    expect(siteName).toBeVisible();
    expect(blockKind).toBeVisible();
    expect(hashedEmail).toBeVisible();
  });

  it('shows the field error for an invalid email and no results', async () => {
    lookUpPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
      },
    });

    await lookUp();

    const error = await screen.findByText('Enter a valid email.');
    const table = screen.queryByRole('region', RESULTS_TABLE);

    expect(error).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('says so when nothing is stored, and offers no erasure', async () => {
    lookUpPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [],
      readerAccount: undefined,
    });

    await lookUp();

    const summary = await screen.findByText('No records found.');
    const empty = screen.getByText('Nothing is stored for this address.');
    const eraseButton = screen.queryByRole('button', ERASE_BUTTON);

    expect(summary).toBeVisible();
    expect(empty).toBeVisible();
    expect(eraseButton).not.toBeInTheDocument();
  });

  it('downloads the export for the searched email', async () => {
    const data = mockPersonalDataExport();
    exportPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      data,
    });
    await lookUp();

    const exportButton = await screen.findByRole('button', EXPORT_BUTTON);
    await user.click(exportButton);
    await waitFor(() => {
      const settledExportButton = screen.getByRole('button', EXPORT_BUTTON);
      expect(settledExportButton).toBeEnabled();
    });

    const [link, fileName, exported] = downloadJsonMock.mock.lastCall ?? [];

    expect(exportPersonalDataActionMock).toHaveBeenCalledWith({
      email: MOCK_DATA_REQUEST_EMAIL,
    });
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(fileName).toBe(DATA_REQUEST_EXPORT_FILE_NAME);
    expect(exported).toEqual({ email: MOCK_DATA_REQUEST_EMAIL, ...data });
  });

  it("shows the reader account's sign-in methods, sessions and bookmarks", async () => {
    await lookUp();

    const providers = await screen.findByText('GitHub and Email link');
    const sessions = screen.getByText('1 session');
    const bookmarks = screen.getByText('1 bookmark');

    expect(providers).toBeVisible();
    expect(sessions).toBeVisible();
    expect(bookmarks).toBeVisible();
  });

  it('erases the reader account too unless the operator unticks it', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      ...ERASED,
      isReaderAccountRefused: false,
    });
    await lookUp();

    const { dialog, confirmField, confirmButton } = await openEraseDialog();
    const checkbox = within(dialog).getByRole(
      'checkbox',
      READER_ACCOUNT_CHECKBOX,
    );

    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    await user.type(confirmField, MOCK_DATA_REQUEST_EMAIL);
    await user.click(confirmButton);

    expect(erasePersonalDataActionMock).toHaveBeenCalledWith({
      email: MOCK_DATA_REQUEST_EMAIL,
      includesReaderAccount: false,
    });
  });

  it('says the sign-up block stays after an erase', async () => {
    await lookUp();

    const { dialog } = await openEraseDialog();
    const note = within(dialog).getByText(SIGNUP_BLOCK_KEPT);

    expect(note).toBeVisible();
  });

  it('explains why a reader account was kept', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      ...ERASED,
      isReaderAccountRefused: true,
    });
    await lookUp();

    const { confirmField, confirmButton } = await openEraseDialog();
    await user.type(confirmField, MOCK_DATA_REQUEST_EMAIL);
    await user.click(confirmButton);

    const toast = await screen.findByText(
      '2 records erased. The reader account was kept: it owns a site or is an operator.',
    );

    expect(toast).toBeVisible();
  });

  it('erases only after the email is typed to confirm, then clears the results', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      ...ERASED,
      isReaderAccountRefused: false,
    });
    await lookUp();

    const { confirmField, confirmButton } = await openEraseDialog();

    expect(confirmButton).toBeDisabled();

    await user.type(confirmField, MOCK_DATA_REQUEST_EMAIL);
    await user.click(confirmButton);

    const toast = await screen.findByText('2 records erased.');
    const table = screen.queryByRole('region', RESULTS_TABLE);

    expect(erasePersonalDataActionMock).toHaveBeenCalledWith({
      email: MOCK_DATA_REQUEST_EMAIL,
      includesReaderAccount: true,
    });
    expect(toast).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('keeps the results and explains when the erasure fails', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    await lookUp();

    const { dialog, confirmField, confirmButton } = await openEraseDialog();
    await user.type(confirmField, MOCK_DATA_REQUEST_EMAIL);
    await user.click(confirmButton);

    const error = await within(dialog).findByText(
      "Couldn't erase the data — try again.",
    );

    const table = screen.getByRole('region', {
      ...RESULTS_TABLE,
      hidden: true,
    });

    expect(error).toBeVisible();
    expect(table).toBeInTheDocument();
  });
});
