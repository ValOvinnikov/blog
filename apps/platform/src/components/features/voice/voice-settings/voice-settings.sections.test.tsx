import { ACTION_OUTCOME, VOICE_SURFACE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  VOICE_CARDS_TEST_ID,
  VOICE_SECTION,
  VOICE_SECTION_ID,
} from '@platform/constants/voice';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { ARIA_CONTROLS, ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { stubMatchingMediaQuery } from '@platform/testing/match-media';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_ARCHIVED_AT } from '@platform/testing/tenants/fixtures';
import {
  EMPTY_STATES_SECTION,
  ERROR_PAGES_SECTION,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import {
  BOOKMARKS,
  EMPTY_LISTS,
  ERROR_PAGE,
  GERMAN,
  NO_OVERRIDES,
  PAGE_NOT_FOUND,
  RESET,
  TOO_LONG_ERROR,
  TWO_LANGUAGES,
  editVoiceHeadingAndSave,
  notFoundHeadingField,
  setupBilingualVoiceSettings,
  setupVoiceSettings,
  voiceCard,
} from '@platform/testing/voice/voice-settings-setup';
import { voiceCardHref } from '@platform/utils/voice-sections/voice-sections';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(6417);

const { EN } = LOCALE_ISO_CODES;

const MOCK_EDIT_TEXT = faker.lorem.word();

const HREF = 'href';
const ERROR_PAGES_HASH = `#${VOICE_SECTION_ID[VOICE_SECTION.ERROR_PAGES].section}`;
const ERROR_PAGES_ALL_DEFAULT = '5 fields · all default';
const SCROLL_TO_START = { behavior: 'smooth', block: 'start' };

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

const summaryRow = (name: string) =>
  within(screen.getByTestId(VOICE_CARDS_TEST_ID)).getByRole('link', {
    name: new RegExp(`^${name}`),
  });

describe(`<${VoiceSettings.name}/> sections`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', window.location.pathname);
  });

  describe(NO_OVERRIDES, () => {
    beforeEach(() => {
      setupVoiceSettings();
    });

    it('starts with every section collapsed, each header controlling its body', () => {
      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);
      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);
      const cards = screen.queryAllByRole('heading', { level: 3 });

      expect(errorPages).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(errorPages).toHaveAttribute(
        ARIA_CONTROLS,
        VOICE_SECTION_ID[VOICE_SECTION.ERROR_PAGES].body,
      );
      expect(emptyStates).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(emptyStates).toHaveAttribute(
        ARIA_CONTROLS,
        VOICE_SECTION_ID[VOICE_SECTION.EMPTY_STATES].body,
      );
      expect(cards).toHaveLength(0);
    });

    it('names each section by its heading', () => {
      const errorPages = screen.getByRole('region', {
        name: new RegExp(`^${ERROR_PAGES_SECTION}`),
      });
      const heading = within(errorPages).getByRole('heading', { level: 2 });

      expect(heading).toHaveTextContent(ERROR_PAGES_SECTION);
    });

    it('reads all default for a section nothing in is customised', () => {
      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);

      expect(errorPages).toHaveTextContent(ERROR_PAGES_ALL_DEFAULT);
    });

    it('counts an unsaved edit at once and drops it again on Reset', async () => {
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      await user.type(notFoundHeadingField(), MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
        '5 fields · 1 customised',
      );

      const resetButton = within(voiceCard(PAGE_NOT_FOUND)).getByRole(
        'button',
        {
          name: RESET,
        },
      );
      await user.click(resetButton);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
        ERROR_PAGES_ALL_DEFAULT,
      );
    });

    it('opens a section from its header and shows its cards', async () => {
      await user.click(voiceSectionHeader(EMPTY_STATES_SECTION));

      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);
      const lists = voiceCard(EMPTY_LISTS);
      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);

      expect(emptyStates).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(lists).toBeVisible();
      expect(errorPages).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('jumps from a summary row to its card, focusing the card heading', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');

      await user.click(summaryRow(BOOKMARKS));

      const bookmarks = voiceCard(BOOKMARKS);
      const heading = within(bookmarks).getByRole('heading', { level: 3 });

      expect(voiceSectionHeader(EMPTY_STATES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(heading).toHaveFocus();
      expect(heading).toHaveAttribute('tabindex', '-1');
      expect(scrollIntoView).toHaveBeenLastCalledWith(SCROLL_TO_START);
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(bookmarks);
      expect(window.location.hash).toBe(voiceCardHref(VOICE_SURFACE.BOOKMARKS));
    });

    it('jumps from a summary row with Enter', async () => {
      summaryRow(PAGE_NOT_FOUND).focus();
      await user.keyboard('{Enter}');

      const heading = within(voiceCard(PAGE_NOT_FOUND)).getByRole('heading', {
        level: 3,
      });

      expect(heading).toHaveFocus();
    });

    it('keeps sections open after a save', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      await editVoiceHeadingAndSave(user, MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
    });

    describe('when the save rejects a field', () => {
      beforeEach(async () => {
        saveVoiceOverridesActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: { [EN]: { notFoundHeading: TOO_LONG_ERROR } },
        });
        await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
      });

      it('shows its section as needing attention', async () => {
        await editVoiceHeadingAndSave(user, MOCK_EDIT_TEXT);

        expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
          '5 fields · 1 field needs attention',
        );
      });

      it('opens the collapsed section that holds it', async () => {
        await user.type(notFoundHeadingField(), MOCK_EDIT_TEXT);
        await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

        const saveBar = screen.getByRole('region', {
          name: UNSAVED_CHANGES,
        });
        const saveButton = within(saveBar).getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveButton);

        expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
          ARIA_EXPANDED,
          'true',
        );
        expect(notFoundHeadingField()).toBeVisible();
      });
    });
  });

  describe(TWO_LANGUAGES, () => {
    beforeEach(() => {
      setupBilingualVoiceSettings();
    });

    it('lists a collapsed section as links to its cards with their counts', () => {
      const notFound = summaryRow(PAGE_NOT_FOUND);
      const errorPage = summaryRow(ERROR_PAGE);
      const lists = summaryRow(EMPTY_LISTS);
      const bookmarks = summaryRow(BOOKMARKS);

      expect(notFound).toHaveAttribute(
        HREF,
        voiceCardHref(VOICE_SURFACE.NOT_FOUND),
      );
      expect(notFound).toHaveTextContent('3 fields');
      expect(notFound).toHaveTextContent('Customised');
      expect(errorPage).toHaveAttribute(
        HREF,
        voiceCardHref(VOICE_SURFACE.ERROR),
      );
      expect(errorPage).toHaveTextContent('2 fields');
      expect(errorPage).toHaveTextContent('Default');
      expect(lists).toHaveAttribute(HREF, voiceCardHref(VOICE_SURFACE.ARCHIVE));
      expect(lists).toHaveTextContent('5 lists');
      expect(bookmarks).toHaveAttribute(
        HREF,
        voiceCardHref(VOICE_SURFACE.BOOKMARKS),
      );
      expect(bookmarks).toHaveTextContent('1 field');
    });

    it('sums each section meta from its cards', () => {
      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);
      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);

      expect(errorPages).toHaveTextContent('5 fields · 2 customised');
      expect(emptyStates).toHaveTextContent('6 fields · 1 customised');
    });

    it('keeps sections open across a language switch', async () => {
      await user.click(voiceSectionHeader(EMPTY_STATES_SECTION));

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      expect(voiceSectionHeader(EMPTY_STATES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'false',
      );
    });
  });

  it('jumps instantly with reduced motion', async () => {
    stubMatchingMediaQuery(MEDIA_QUERY.REDUCED_MOTION);
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    setupVoiceSettings();

    await user.click(summaryRow(ERROR_PAGE));

    expect(scrollIntoView).toHaveBeenLastCalledWith({
      ...SCROLL_TO_START,
      behavior: 'instant',
    });
  });

  describe('on first load', () => {
    it.each([
      [voiceCardHref(VOICE_SURFACE.ARCHIVE), EMPTY_STATES_SECTION, EMPTY_LISTS],
      [ERROR_PAGES_HASH, ERROR_PAGES_SECTION, PAGE_NOT_FOUND],
    ])(
      'opens and scrolls to what a %s hash points into',
      (hash, section, cardName) => {
        window.history.replaceState(null, '', hash);
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
        setupVoiceSettings();

        const header = voiceSectionHeader(section);
        const shownCard = voiceCard(cardName);

        expect(header).toHaveAttribute(ARIA_EXPANDED, 'true');
        expect(shownCard).toBeVisible();
        expect(scrollIntoView).toHaveBeenCalledWith(SCROLL_TO_START);
      },
    );

    it('ignores a hash that changes after the page loaded', async () => {
      window.history.replaceState(null, '', ERROR_PAGES_HASH);
      setupVoiceSettings();
      window.history.replaceState(
        null,
        '',
        voiceCardHref(VOICE_SURFACE.ARCHIVE),
      );

      await user.type(notFoundHeadingField(), MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(voiceSectionHeader(EMPTY_STATES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'false',
      );
    });
  });

  it('keeps section headers and summary rows operable for an archived tenant', async () => {
    setupVoiceSettings({ archivedAt: MOCK_ARCHIVED_AT });

    await user.click(summaryRow(EMPTY_LISTS));
    await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

    expect(voiceCard(EMPTY_LISTS)).toBeVisible();
    expect(voiceCard(PAGE_NOT_FOUND)).toBeVisible();
  });
});
