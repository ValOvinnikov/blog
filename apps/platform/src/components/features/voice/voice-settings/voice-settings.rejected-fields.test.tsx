import { ACTION_OUTCOME, VOICE_FIELD_ERROR } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { UNSAVED_CHANGES } from '@platform/testing/render-in-settings-form';
import { TOPIC_FIELD } from '@platform/testing/voice/fixtures';
import {
  ERROR_PAGES_SECTION,
  openVoiceSections,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  EMPTY_LISTS,
  GERMAN,
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

faker.seed(6419);

const { EN, DE } = LOCALE_ISO_CODES;

const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const TAG_PAGE = 'Tag page';
const ENGLISH = 'English';

const missingName = {
  reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
  values: { placeholders: '{name}', count: 1 },
};

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

describe(`<${VoiceSettings.name}/> rejected fields`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
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
      name: TOPIC_FIELD,
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
