import { ACTION_OUTCOME } from '@blog/config';
import {
  DATA_REQUEST_EXPORT_FILE_NAME,
  DATA_REQUEST_FIELD_ERROR,
  DATA_REQUEST_MATCH_KIND,
} from '@platform/constants/data-request';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  DATA_REQUEST_EMAIL,
  DATA_REQUEST_SITE_NAME,
  makeDataRequestMatch,
  makePersonalDataExport,
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
const BLOCK_MATCH = makeDataRequestMatch({
  key: 'SIGNUP_BLOCK-block-1',
  kind: DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
  siteName: undefined,
  email: undefined,
});

const setup = customRender(DataRequestPanel, {});

describe(`<${DataRequestPanel.name}/>`, () => {
  let user: UserEvent;

  const lookUp = async (email = DATA_REQUEST_EMAIL) => {
    const emailField = screen.getByRole('textbox', EMAIL_FIELD);
    await user.type(emailField, email);
    await user.click(screen.getByRole('button', FIND_BUTTON));
  };

  beforeEach(() => {
    user = userEvent.setup();
    lookUpPersonalDataActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [makeDataRequestMatch(), BLOCK_MATCH],
    });
    exportPersonalDataActionMock.mockReset();
    erasePersonalDataActionMock.mockReset();
    downloadJsonMock.mockReset();
    setup();
  });

  it('searches for the entered email and lists every match by kind and site', async () => {
    await lookUp();

    const table = await screen.findByRole('region', RESULTS_TABLE);

    expect(lookUpPersonalDataActionMock).toHaveBeenCalledWith({
      email: DATA_REQUEST_EMAIL,
    });
    expect(within(table).getByText('Subscriber')).toBeVisible();
    expect(within(table).getByText(DATA_REQUEST_SITE_NAME)).toBeVisible();
    expect(within(table).getByText('Sign-up block')).toBeVisible();
    expect(within(table).getByText('Stored as a hash')).toBeVisible();
  });

  it('shows the field error for an invalid email and no results', async () => {
    lookUpPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: { reason: DATA_REQUEST_FIELD_ERROR.EMAIL_INVALID },
      },
    });

    await lookUp();

    const error = await screen.findByText('Enter a valid email address.');

    expect(error).toBeVisible();
    expect(screen.queryByRole('region', RESULTS_TABLE)).not.toBeInTheDocument();
  });

  it('says so when nothing is stored, and offers no erasure', async () => {
    lookUpPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      matches: [],
    });

    await lookUp();

    const summary = await screen.findByText('No records found.');
    const empty = screen.getByText('Nothing is stored for this address.');

    expect(summary).toBeVisible();
    expect(empty).toBeVisible();
    expect(screen.queryByRole('button', ERASE_BUTTON)).not.toBeInTheDocument();
  });

  it('downloads the export for the searched email', async () => {
    const data = makePersonalDataExport();
    exportPersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      data,
    });
    await lookUp();

    await user.click(await screen.findByRole('button', EXPORT_BUTTON));

    expect(exportPersonalDataActionMock).toHaveBeenCalledWith({
      email: DATA_REQUEST_EMAIL,
    });
    expect(downloadJsonMock).toHaveBeenCalledWith(
      DATA_REQUEST_EXPORT_FILE_NAME,
      { email: DATA_REQUEST_EMAIL, ...data },
    );
  });

  it('erases only after the email is typed to confirm, then clears the results', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      erasedCount: 2,
    });
    await lookUp();

    await user.click(await screen.findByRole('button', ERASE_BUTTON));
    const dialog = await screen.findByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', ERASE_CONFIRM_BUTTON);

    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox'), DATA_REQUEST_EMAIL);
    await user.click(confirm);

    const toast = await screen.findByText('2 records erased.');

    expect(erasePersonalDataActionMock).toHaveBeenCalledWith({
      email: DATA_REQUEST_EMAIL,
    });
    expect(toast).toBeVisible();
    expect(screen.queryByRole('region', RESULTS_TABLE)).not.toBeInTheDocument();
  });

  it('keeps the results and explains when the erasure fails', async () => {
    erasePersonalDataActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    await lookUp();

    await user.click(await screen.findByRole('button', ERASE_BUTTON));
    const dialog = await screen.findByRole('alertdialog');
    await user.type(within(dialog).getByRole('textbox'), DATA_REQUEST_EMAIL);
    await user.click(within(dialog).getByRole('button', ERASE_CONFIRM_BUTTON));

    const error = await within(dialog).findByText(
      "Couldn't erase the data — try again.",
    );

    expect(error).toBeVisible();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    const table = await screen.findByRole('region', RESULTS_TABLE);

    expect(table).toBeVisible();
  });
});
