import { ACTION_OUTCOME, VOICE_FIELD_ERROR } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { VOICE_CARDS_TEST_ID } from '@platform/constants/voice';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { screen, within } from '@platform/testing/custom-render';
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
  openVoiceSections,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  EMPTY_LISTS,
  GERMAN,
  MOCK_MAX_LENGTH,
  STORED_VOICE_OVERRIDES,
  TOO_LONG_ERROR,
  activeLanguageLabel,
  editVoiceHeadingAndSave,
  notFoundHeadingField,
  setupBilingualVoiceSettings,
  setupVoiceSettings,
  voiceCard,
} from '@platform/testing/voice/voice-settings-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(6418);

const { EN, DE } = LOCALE_ISO_CODES;

const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const TOO_LONG_MESSAGE = `Use ${MOCK_MAX_LENGTH} characters or fewer.`;
const TAG_PAGE = 'Tag page';
const TOPIC_PAGE = 'Topic page';
const ENGLISH = 'English';

const missingName = {
  reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
  values: { placeholders: '{name}', count: 1 },
};

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

  const goToFirstRejectedField = async () => {
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const firstFieldLink = within(saveBar).getByRole('link', {
      name: 'Go to the first one',
    });
    await user.click(firstFieldLink);
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
    saveVoiceOverridesActionMock.mockReturnValueOnce(new Promise(() => {}));
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
  });

  it('shows a toast and refreshes after a successful save', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setupVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    const toast = await screen.findByText('Voice saved.');

    expect(toast).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setupVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent("Couldn't save");
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

  it('opens the language and list that hold a rejected field', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale: { [DE]: { tagEmpty: missingName } },
    });
    setupBilingualVoiceSettings();

    await openErrorPages();

    await editVoiceHeadingAndSave(user, MOCK_EDIT_TEXT);

    const fieldError = await screen.findByText(
      'Keep the placeholder {name} — the site fills it in.',
    );
    const tagField = within(voiceCard(EMPTY_LISTS)).getByRole('textbox', {
      name: TAG_PAGE,
    });
    const germanLabel = activeLanguageLabel(GERMAN);

    expect(fieldError).toBeVisible();
    expect(tagField).toBeVisible();
    expect(germanLabel).toBeVisible();
  });

  describe('when fields are rejected', () => {
    it('counts a field rejected in two languages once per language', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {
          [EN]: { notFoundHeading: TOO_LONG_ERROR },
          [DE]: { notFoundHeading: TOO_LONG_ERROR },
        },
      });
      setupBilingualVoiceSettings();

      await openErrorPages();

      await editVoiceHeadingAndSave(user, MOCK_EDIT_TEXT);

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });

      expect(saveBar).toHaveTextContent('2 fields need attention');
    });

    it('goes to the first rejected field in page order', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {
          [EN]: {
            blogListEmpty: missingName,
            notFoundHeading: TOO_LONG_ERROR,
          },
        },
      });
      setupVoiceSettings();

      await openErrorPages();

      await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);
      await goToFirstRejectedField();

      const focusedField = notFoundHeadingField();

      expect(focusedField).toHaveFocus();
    });

    it('opens an earlier rejected list in place of the open one', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {
          [EN]: { topicEmpty: missingName, tagEmpty: missingName },
        },
      });
      setupVoiceSettings();

      await openVoiceSections(user);

      const section = voiceCard(EMPTY_LISTS);
      const tagRow = within(section).getByRole('button', {
        name: /Tag page/,
      });
      await user.click(tagRow);
      await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);
      await goToFirstRejectedField();

      const topicField = within(section).getByRole('textbox', {
        name: TOPIC_PAGE,
      });

      expect(topicField).toHaveFocus();
    });

    it('returns to the language that holds the first rejected field', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [DE]: { tagEmpty: missingName } },
      });
      setupBilingualVoiceSettings();

      await openVoiceSections(user);

      await editVoiceHeadingAndSave(user, MOCK_EDIT_TEXT);

      const englishRadio = screen.getByRole('radio', { name: ENGLISH });
      await user.click(englishRadio);
      await goToFirstRejectedField();

      const germanLabel = activeLanguageLabel(GERMAN);
      const tagField = within(voiceCard(EMPTY_LISTS)).getByRole('textbox', {
        name: TAG_PAGE,
      });

      expect(germanLabel).toBeVisible();
      expect(tagField).toHaveFocus();
    });
  });
});
