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
  DISCARD,
  ONE_FIELD_NEEDS_ATTENTION,
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
import { ACTION_OUTCOME } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
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

  describe('in one language', () => {
    beforeEach(async () => {
      setupVoiceSettings();
      await openErrorPages();
    });

    it('makes the page content inert while the save bar keeps focus on Saving…', async () => {
      let resolveSave: (result: TSaveVoiceOverridesResult) => void = () => {};
      saveVoiceOverridesActionMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
      );
      await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const barSave = within(saveBar).getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(barSave);

      const cards = screen.getByTestId(VOICE_CARDS_TEST_ID);
      const savingButton = within(saveBar).getByRole('button', {
        name: SAVING,
      });

      expect(cards).toHaveAttribute('inert');
      expect(saveBar).not.toContainElement(cards);
      expect(cards).not.toContainElement(saveBar);
      expect(savingButton).toHaveFocus();

      resolveSave({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      await screen.findAllByRole('alert');
    });

    it('shows no save bar until something changes', () => {
      const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

      expect(saveBar).not.toBeInTheDocument();
    });

    it('restores the saved values and drops the bar on Discard', async () => {
      await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const discard = within(saveBar).getByRole('button', { name: DISCARD });
      const save = within(saveBar).getByRole('button', { name: SAVE_CHANGES });

      expect(save).toBeVisible();
      await user.click(discard);

      expect(saveBar).not.toBeInTheDocument();
      expect(notFoundHeadingField()).not.toHaveTextContent(MOCK_TYPED_TEXT);
    });

    it('shows a failed save once, in the save bar, without refreshing', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

      const alerts = await screen.findAllByRole('alert');
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const barAlert = within(saveBar).getByRole('alert');

      expect(barAlert).toHaveTextContent(SAVE_FAILED);
      expect(alerts).toEqual([barAlert]);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('shows a rejected field inline until the editor changes it', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [EN]: { notFoundHeading: TOO_LONG_ERROR } },
      });
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
      expect(saveBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
      expect(firstFieldLink).toHaveAttribute('href', `#${rejectedField.id}`);

      await user.type(rejectedField, MOCK_EDIT_TEXT);

      const clearedError = screen.queryByText(TOO_LONG_MESSAGE);

      expect(clearedError).not.toBeInTheDocument();
    });

    describe('after a successful save', () => {
      beforeEach(() => {
        saveVoiceOverridesActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.SUCCESS,
        });
      });

      it('returns focus to the edited field after a save from the save bar', async () => {
        await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);

        const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
        const barSave = within(saveBar).getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(barSave);

        await screen.findByText(VOICE_SAVED);
        await waitFor(() => expect(notFoundHeadingField()).toHaveFocus());
      });

      it('shows a toast and refreshes', async () => {
        await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

        const toast = await screen.findByText(VOICE_SAVED);

        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalled();
      });
    });
  });
});
