import { ACTION_OUTCOME } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { VOICE_CARDS_TEST_ID } from '@platform/constants/voice';
import en from '@platform/i18n/messages/en.json';
import {
  saveVoiceOverridesAction,
  type TSaveVoiceOverridesResult,
} from '@platform/server/site-config/save-voice-overrides-action';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ONE_UNSAVED_CHANGE,
  SAVE_CHANGES,
  SAVING,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import {
  ERROR_PAGES_SECTION,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  MOCK_MAX_LENGTH,
  STORED_VOICE_OVERRIDES,
  TOO_LONG_ERROR,
  editVoiceHeadingAndSave,
  notFoundHeadingField,
  setupBilingualVoiceSettings,
  setupVoiceSettings,
} from '@platform/testing/voice/voice-settings-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(6418);

const { EN, DE } = LOCALE_ISO_CODES;

const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const TOO_LONG_MESSAGE = `Use ${MOCK_MAX_LENGTH} characters or fewer.`;
const { alertError: SAVE_FAILED, alertSuccess: VOICE_SAVED } = en.voiceSettings;

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

describe(`<${VoiceSettings.name}/> saving`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  const openErrorPages = async () => {
    await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
  };

  it('saves untouched rich fields exactly as stored, in every language', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setupBilingualVoiceSettings();

    await openErrorPages();

    const headingField = notFoundHeadingField();
    await user.clear(headingField);
    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    expect(saveVoiceOverridesActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      [EN]: {
        notFoundHeading: MOCK_TYPED_TEXT,
        notFoundSupportingText:
          STORED_VOICE_OVERRIDES[EN].notFoundSupportingText,
        bookmarksEmpty: STORED_VOICE_OVERRIDES[EN].bookmarksEmpty,
      },
      [DE]: {
        localeErrorDescription:
          STORED_VOICE_OVERRIDES[DE].localeErrorDescription,
      },
    });
  });

  it('makes the page content inert while the phone footer keeps focus on Saving…', async () => {
    let resolveSave: (result: TSaveVoiceOverridesResult) => void = () => {};
    saveVoiceOverridesActionMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    setupVoiceSettings();

    await openErrorPages();

    await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);

    const footer = screen.getByRole('region', { name: ONE_UNSAVED_CHANGE });
    const footerSave = within(footer).getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(footerSave);

    const cards = screen.getByTestId(VOICE_CARDS_TEST_ID);
    const savingButton = within(footer).getByRole('button', { name: SAVING });

    expect(cards).toHaveAttribute('inert');
    expect(footer).not.toContainElement(cards);
    expect(cards).not.toContainElement(footer);
    expect(savingButton).toHaveFocus();

    resolveSave({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    await screen.findAllByRole('alert');
  });

  it('returns focus to the edited field after a save from the phone footer', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setupVoiceSettings();

    await openErrorPages();

    await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);

    const footer = screen.getByRole('region', { name: ONE_UNSAVED_CHANGE });
    const footerSave = within(footer).getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(footerSave);

    await screen.findByText(VOICE_SAVED);
    await waitFor(() => expect(notFoundHeadingField()).toHaveFocus());
  });

  it('shows a toast and refreshes after a successful save', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setupVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    const toast = await screen.findByText(VOICE_SAVED);

    expect(toast).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows the failure in the save bar and the phone footer and does not refresh when the save fails', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setupVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    const alerts = await screen.findAllByRole('alert');
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const barAlert = within(saveBar).getByRole('alert');

    expect(barAlert).toHaveTextContent(SAVE_FAILED);
    expect(alerts).toHaveLength(2);
    alerts.forEach((alert) => expect(alert).toHaveTextContent(SAVE_FAILED));
    expect(refresh).not.toHaveBeenCalled();
  });

  it('shows a rejected field inline until the editor changes it', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale: { [EN]: { notFoundHeading: TOO_LONG_ERROR } },
    });
    setupVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    const fieldError = await screen.findByText(TOO_LONG_MESSAGE);
    const rejectedField = notFoundHeadingField();
    const alert = screen.queryByRole('alert');
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const firstFieldLink = within(saveBar).getByRole('link');

    expect(fieldError).toBeVisible();
    expect(rejectedField).toHaveAccessibleDescription(
      `${en.voiceFieldHints.notFoundHeading} ${TOO_LONG_MESSAGE}`,
    );
    expect(alert).not.toBeInTheDocument();
    expect(saveBar).toHaveTextContent('1 field needs attention');
    expect(firstFieldLink).toHaveAttribute('href', `#${rejectedField.id}`);

    await user.type(rejectedField, MOCK_EDIT_TEXT);

    const clearedError = screen.queryByText(TOO_LONG_MESSAGE);

    expect(clearedError).not.toBeInTheDocument();
  });
});
