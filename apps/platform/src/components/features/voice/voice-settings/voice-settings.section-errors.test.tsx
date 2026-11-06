import { ACTION_OUTCOME } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { TOPIC_FIELD } from '@platform/testing/voice/fixtures';
import {
  EMPTY_STATES_SECTION,
  ERROR_PAGES_SECTION,
  voiceSectionChip,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  EMPTY_LISTS,
  MISSING_NAME_ERROR,
  MISSING_NAME_MESSAGE,
  TOO_LONG_ERROR,
  editVoiceHeadingAndSave,
  notFoundHeadingField,
  setupBilingualVoiceSettings,
  setupVoiceSettings,
  voiceCard,
} from '@platform/testing/voice/voice-settings-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(6422);

const { EN } = LOCALE_ISO_CODES;

const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const ONE_CUSTOMISED = '1 customised';
const ONE_ERROR = '1 error';
const TAG_PAGE = 'Tag page';

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

describe(`<${VoiceSettings.name}/> section errors`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  const saveWithErrorPagesOpen = async () => {
    await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
    await editVoiceHeadingAndSave(user, MOCK_TYPED_TEXT);
  };

  describe('with a rejected heading on the Error pages', () => {
    beforeEach(async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [EN]: { notFoundHeading: TOO_LONG_ERROR } },
      });
      setupVoiceSettings();
      await saveWithErrorPagesOpen();
    });

    it('marks the chip and the meta of its section', async () => {
      const errorPill = await within(
        voiceSectionChip(ERROR_PAGES_SECTION),
      ).findByText(ONE_ERROR);
      const errorPagesHeader = voiceSectionHeader(ERROR_PAGES_SECTION);
      const emptyStatesChip = voiceSectionChip(EMPTY_STATES_SECTION);

      expect(errorPill).toBeVisible();
      expect(errorPagesHeader).toHaveTextContent('1 field needs attention');
      expect(emptyStatesChip).not.toHaveTextContent('error');
    });

    it('restores the chip and the meta once the field changes', async () => {
      await within(voiceSectionChip(ERROR_PAGES_SECTION)).findByText(ONE_ERROR);
      await user.type(notFoundHeadingField(), MOCK_EDIT_TEXT);

      const errorPagesChip = voiceSectionChip(ERROR_PAGES_SECTION);
      const errorPagesHeader = voiceSectionHeader(ERROR_PAGES_SECTION);

      expect(errorPagesChip).toHaveTextContent(ONE_CUSTOMISED);
      expect(errorPagesHeader).toHaveTextContent(ONE_CUSTOMISED);
      expect(errorPagesHeader).not.toHaveTextContent('needs attention');
    });
  });

  it('opens the collapsed section of a rejected field and focuses it', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale: { [EN]: { notFoundHeading: TOO_LONG_ERROR } },
    });
    setupVoiceSettings();

    await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
    await user.type(notFoundHeadingField(), MOCK_TYPED_TEXT);
    await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const saveButton = within(saveBar).getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveButton);

    await waitFor(() => expect(notFoundHeadingField()).toHaveFocus());
  });

  it('opens the section and the row of a rejected list field and focuses it', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale: { [EN]: { topicEmpty: MISSING_NAME_ERROR } },
    });
    setupVoiceSettings();

    await saveWithErrorPagesOpen();

    const emptyStatesHeader = voiceSectionHeader(EMPTY_STATES_SECTION);
    const topicField = () =>
      within(voiceCard(EMPTY_LISTS)).getByRole('textbox', {
        name: TOPIC_FIELD,
      });

    await waitFor(() => expect(topicField()).toHaveFocus());
    expect(emptyStatesHeader).toHaveAttribute(ARIA_EXPANDED, 'true');
  });

  it('counts every rejected field of a section and opens only the first row', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale: {
        [EN]: { topicEmpty: MISSING_NAME_ERROR, tagEmpty: MISSING_NAME_ERROR },
      },
    });
    setupVoiceSettings();

    await saveWithErrorPagesOpen();

    const errorPill = await within(
      voiceSectionChip(EMPTY_STATES_SECTION),
    ).findByText('2 errors');
    const emptyStatesHeader = voiceSectionHeader(EMPTY_STATES_SECTION);
    const emptyLists = within(voiceCard(EMPTY_LISTS));
    const topicField = emptyLists.getByRole('textbox', { name: TOPIC_FIELD });
    const tagRow = emptyLists.getByRole('button', {
      name: new RegExp(TAG_PAGE),
    });

    expect(errorPill).toBeVisible();
    expect(emptyStatesHeader).toHaveTextContent('2 fields need attention');
    expect(topicField).toHaveAccessibleDescription(
      `${en.voiceFieldHints.topicEmpty} ${MISSING_NAME_MESSAGE}`,
    );
    expect(tagRow).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(tagRow).toHaveAccessibleDescription(MISSING_NAME_MESSAGE);
  });

  it('keeps every chip and meta when a save fails with no rejected field', async () => {
    saveVoiceOverridesActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setupBilingualVoiceSettings();

    await saveWithErrorPagesOpen();
    await screen.findAllByRole('alert');

    const emptyStatesChip = voiceSectionChip(EMPTY_STATES_SECTION);
    const emptyStatesHeader = voiceSectionHeader(EMPTY_STATES_SECTION);
    const errorPill = screen.queryByText(/\d errors?$/);

    expect(emptyStatesChip).toHaveTextContent(ONE_CUSTOMISED);
    expect(emptyStatesHeader).toHaveTextContent(ONE_CUSTOMISED);
    expect(errorPill).not.toBeInTheDocument();
  });
});
