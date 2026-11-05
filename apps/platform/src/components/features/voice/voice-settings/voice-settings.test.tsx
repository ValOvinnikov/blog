import {
  ACTION_OUTCOME,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_ERROR,
  VOICE_SURFACE,
  type TVoicePortableText,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { VOICE_CARDS_TEST_ID } from '@platform/constants/voice';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { stubMatchingMediaQuery } from '@platform/testing/match-media';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ARCHIVED_NOTICE_TEXT,
  ONE_UNSAVED_CHANGE,
  SAVE_CHANGES,
  SAVING,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { NOTHING_HERE } from '@platform/testing/voice/fixtures';
import {
  EMPTY_STATES_SECTION,
  ERROR_PAGES_SECTION,
  openVoiceSections,
  voiceSectionHeader,
} from '@platform/testing/voice/sections';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings, type TVoiceSettingsProps } from './voice-settings';

faker.seed(5994);

const { EN, DE } = LOCALE_ISO_CODES;

const MOCK_MAX_LENGTH = 100;
const MOCK_ACCENT_HUE = 28;
const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const MOCK_EDIT_TEXT_DE = faker.lorem.word();
const MOCK_SUPPORTING_TEXT = faker.lorem.words(2);
const MOCK_BOOKMARKS_TEXT = faker.lorem.words(3);
const MOCK_ERROR_DESCRIPTION_DE = faker.lorem.words(2);

const TOO_LONG_MESSAGE = `Use ${MOCK_MAX_LENGTH} characters or fewer.`;
const KEEP_NAME_PLACEHOLDER = 'Keep {name} — the site fills it in.';

const tooLong = {
  reason: VOICE_FIELD_ERROR.TOO_LONG,
  values: { max: MOCK_MAX_LENGTH },
};

const missingName = {
  reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
  values: { placeholders: '{name}', count: 1 },
};

vi.mock('@platform/server/site-config/save-voice-overrides-action', () => ({
  saveVoiceOverridesAction: vi.fn(),
}));

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

const richText = (text: string, key: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: `${key}-b`,
    style: 'normal',
    children: [
      { _type: 'span', _key: `${key}-s1`, text, marks: ['em'] },
      { _type: 'span', _key: `${key}-s2`, text: ' here', marks: ['l1'] },
    ],
    markDefs: [{ _type: 'link', _key: 'l1', href: '/blog' }],
  },
];

const storedOverrides = {
  [EN]: {
    notFoundHeading: NOTHING_HERE,
    notFoundSupportingText: richText(MOCK_SUPPORTING_TEXT, 'en-nf'),
    bookmarksEmpty: richText(MOCK_BOOKMARKS_TEXT, 'en-bm'),
  },
  [DE]: {
    localeErrorDescription: richText(MOCK_ERROR_DESCRIPTION_DE, 'de-err'),
  },
};

const VoiceSettingsWithListSamples = (props: TVoiceSettingsProps) => (
  <VoiceListSamplesProvider
    samplesByLocale={{
      [EN]: en.voiceSpecimen.lists,
      [DE]: de.voiceSpecimen.lists,
    }}
  >
    <VoiceSettings {...props} />
  </VoiceListSamplesProvider>
);

const setup = customRender(VoiceSettingsWithListSamples, {
  tenantId: MOCK_TENANT_ID,
  initialDraft: buildVoiceDraft({}, [EN]),
  defaultLocale: EN,
  liveLocales: [EN],
  previewTheme: defaultLookFormValues(),
});

const setupBilingual = (overrides: Partial<TVoiceSettingsProps> = {}) =>
  setup({
    initialDraft: buildVoiceDraft(storedOverrides, [EN, DE]),
    liveLocales: [EN, DE],
    ...overrides,
  });

const card = (name: string) => screen.getByRole('region', { name });

const ERROR_PAGES_BODY_ID = 'sec-errors-body';
const EMPTY_STATES_BODY_ID = 'sec-empty-body';
const ARIA_EXPANDED = 'aria-expanded';
const ARIA_CONTROLS = 'aria-controls';
const HREF = 'href';
const LISTS_HASH = '#s-lists';
const BOOKMARKS_HASH = '#s-bookmarks';
const ERROR_PAGES_ALL_DEFAULT = '5 fields · all default';
const SCROLL_TO_START = { behavior: 'smooth', block: 'start' };

const summaryRow = (name: string) =>
  screen.getByRole('link', { name: new RegExp(`^${name}`) });

const PAGE_NOT_FOUND = 'Page not found';
const ERROR_PAGE = 'Error page';
const EMPTY_LISTS = 'Empty lists';
const BOOKMARKS = 'Bookmarks';
const GERMAN = 'German';
const ENGLISH = 'English';
const LANGUAGE = 'Language';
const TAG_PAGE = 'Tag page';
const TOPIC_PAGE = 'Topic page';
const BLOG_INDEX_PAGE = 'Blog index page';
const RESET = 'Reset';
const SHOW_PREVIEW = 'Show preview';
const HEADING_KEY_TEST_ID = 'voice-key-notFoundHeading';
const DATA_FOCUSED = 'data-focused';
const NO_OVERRIDES = 'with no overrides';
const TWO_LANGUAGES = 'with stored overrides in two live languages';
const FOLLOWS = Node.DOCUMENT_POSITION_FOLLOWING;

const notFoundHeading = () =>
  within(card(PAGE_NOT_FOUND)).getByRole('textbox', { name: 'Heading' });

const previewColorSchemeGroup = () =>
  screen.getByRole('group', {
    name: en.previewModeControl.previewColorSchemeAriaLabel,
  });

const activeLanguageLabel = (language: string) =>
  screen.getByText(language, { selector: 'strong' });

describe(`<${VoiceSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  const editHeadingAndSave = async (text: string) => {
    const headingField = notFoundHeading();
    await user.type(headingField, text);

    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const saveButton = within(saveBar).getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveButton);
  };

  const goToFirstRejectedField = async () => {
    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const firstFieldLink = within(saveBar).getByRole('link', {
      name: 'Go to the first one',
    });
    await user.click(firstFieldLink);
  };

  describe(NO_OVERRIDES, () => {
    beforeEach(async () => {
      setup();
      await openVoiceSections(user);
    });

    it('shows one card per surface, in page order', () => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      const headingTexts = headings.map((heading) => heading.textContent);

      expect(headingTexts).toEqual([
        PAGE_NOT_FOUND,
        ERROR_PAGE,
        EMPTY_LISTS,
        BOOKMARKS,
      ]);
    });

    it('offers every field with its default as the placeholder', () => {
      const headingField = notFoundHeading();
      const supportingText = within(card(PAGE_NOT_FOUND)).getByRole('textbox', {
        name: 'Supporting text',
      });
      const errorDescription = within(card(ERROR_PAGE)).getByRole('textbox', {
        name: 'Description',
      });
      const emptyBookmarks = within(card(BOOKMARKS)).getByRole('textbox', {
        name: 'Empty bookmarks',
      });

      expect(headingField).toHaveAttribute(
        'placeholder',
        SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
      );
      expect(supportingText).toBeVisible();
      expect(errorDescription).toBeVisible();
      expect(emptyBookmarks).toBeVisible();
    });

    it('notes that buttons and labels are not editable here, without naming a language', () => {
      const note = screen.getByRole('note');

      expect(note).toHaveTextContent(
        /^Buttons, menus and labels are translated for you/,
      );
      expect(note).not.toHaveTextContent(ENGLISH);
    });

    it('marks an edited field customised and unsaved until Reset', async () => {
      const section = card(PAGE_NOT_FOUND);
      const defaultBadges = within(section).getAllByText('Default');

      expect(defaultBadges).toHaveLength(3);

      const headingField = notFoundHeading();
      await user.type(headingField, MOCK_TYPED_TEXT);

      const customisedBadge = within(section).getByText('Customised');
      const unsavedBadge = within(section).getByRole('img', {
        name: 'Unsaved',
      });
      const customisedSummary = within(section).getByText(
        '3 fields · 1 customised',
      );

      expect(customisedBadge).toBeVisible();
      expect(unsavedBadge).toBeVisible();
      expect(customisedSummary).toBeVisible();

      const resetButton = within(section).getByRole('button', { name: RESET });
      await user.click(resetButton);

      const resetHeadingField = notFoundHeading();
      const defaultSummary = within(section).getByText(
        '3 fields · all default',
      );

      expect(resetHeadingField).toHaveValue('');
      expect(defaultSummary).toBeVisible();
    });

    it('counts the empty-list card in lists', () => {
      const listsSummary = within(card(EMPTY_LISTS)).getByText(
        '5 lists · all default',
      );

      expect(listsSummary).toBeVisible();
    });
  });

  describe(TWO_LANGUAGES, () => {
    beforeEach(async () => {
      setupBilingual();
      await openVoiceSections(user);
    });

    it('summarises each card with its field count and customised count', () => {
      const notFoundSummary = within(card(PAGE_NOT_FOUND)).getByText(
        '3 fields · 2 customised',
      );
      const errorSummary = within(card(ERROR_PAGE)).getByText(
        '2 fields · all default',
      );
      const bookmarksSummary = within(card(BOOKMARKS)).getByText(
        '1 field · 1 customised',
      );

      expect(notFoundSummary).toBeVisible();
      expect(errorSummary).toBeVisible();
      expect(bookmarksSummary).toBeVisible();
    });

    it('restores the saved values on Discard', async () => {
      const headingField = notFoundHeading();
      await user.clear(headingField);

      const unsavedRegion = screen.getByRole('region', {
        name: UNSAVED_CHANGES,
      });

      expect(unsavedRegion).toHaveTextContent('1 unsaved change');

      const discardButton = screen.getByRole('button', { name: 'Discard' });
      await user.click(discardButton);

      const restoredHeadingField = notFoundHeading();

      expect(restoredHeadingField).toHaveValue(NOTHING_HERE);
    });

    it('reads the heading, the language switcher, the note, then the Live preview switch', () => {
      const heading = screen.getByRole('heading', { level: 1, name: 'Voice' });
      const switcher = screen.getByRole('radiogroup', { name: LANGUAGE });
      const note = screen.getByRole('note');
      const previewSwitch = previewColorSchemeGroup();

      expect(heading.compareDocumentPosition(switcher)).toBe(FOLLOWS);
      expect(switcher.compareDocumentPosition(note)).toBe(FOLLOWS);
      expect(note.compareDocumentPosition(previewSwitch)).toBe(FOLLOWS);
    });

    it('names the language being edited in the note', () => {
      const note = screen.getByRole('note');

      expect(note).toContainElement(activeLanguageLabel(ENGLISH));
    });

    it('describes each live language, marking the default', () => {
      const switcher = screen.getByRole('radiogroup', { name: LANGUAGE });
      const englishRadio = within(switcher).getByRole('radio', {
        name: ENGLISH,
      });
      const germanRadio = within(switcher).getByRole('radio', {
        name: GERMAN,
      });

      expect(englishRadio).toHaveAccessibleDescription(
        'Default language · 3 customised',
      );
      expect(germanRadio).toHaveAccessibleDescription('1 customised');
    });

    it("edits the selected language against that language's defaults", async () => {
      const englishHeadingField = notFoundHeading();

      expect(englishHeadingField).toHaveValue(NOTHING_HERE);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const germanHeadingField = notFoundHeading();
      const germanLabel = activeLanguageLabel(GERMAN);

      expect(germanHeadingField).toHaveValue('');
      expect(germanHeadingField).toHaveAttribute(
        'placeholder',
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
      expect(germanLabel).toBeVisible();
    });

    it('breaks the unsaved count down by language', async () => {
      const englishHeadingField = notFoundHeading();
      await user.type(englishHeadingField, MOCK_EDIT_TEXT);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const germanHeadingField = notFoundHeading();
      await user.type(germanHeadingField, MOCK_EDIT_TEXT_DE);

      const unsavedRegion = screen.getByRole('region', {
        name: UNSAVED_CHANGES,
      });

      expect(unsavedRegion).toHaveTextContent(
        '2 unsaved changesEnglish 1 · German 1',
      );
    });
  });

  it('shows no language switcher for a single-language site', () => {
    setup();

    const switcher = screen.queryByRole('radiogroup', { name: LANGUAGE });

    expect(switcher).not.toBeInTheDocument();
  });

  describe('specimens', () => {
    it('switches every specimen to the dark ramp from the colour scheme', async () => {
      setup({
        previewTheme: {
          ...defaultLookFormValues(),
          accentHue: MOCK_ACCENT_HUE,
        },
      });
      await openVoiceSections(user);

      const darkButton = screen.getByRole('button', { name: 'Dark' });
      await user.click(darkButton);

      const specimen = screen.getByTestId(
        `voice-specimen-${VOICE_SURFACE.NOT_FOUND}`,
      );

      expect(specimen).toHaveStyle({
        '--brand-primary-solid': `oklch(0.7 0.16 ${MOCK_ACCENT_HUE})`,
      });
    });

    describe(NO_OVERRIDES, () => {
      beforeEach(async () => {
        setup();
        await openVoiceSections(user);
      });

      it('re-renders the specimen beside a field as the editor types', async () => {
        const headingField = notFoundHeading();
        await user.type(headingField, MOCK_TYPED_TEXT);

        const specimen = screen.getByTestId(
          `voice-specimen-${VOICE_SURFACE.NOT_FOUND}`,
        );
        const typedText = within(specimen).getByText(MOCK_TYPED_TEXT);

        expect(typedText).toBeVisible();
      });

      it("outlines the focused field's text in its specimen", async () => {
        const headingField = notFoundHeading();
        await user.click(headingField);

        const focusedKey = screen.getByTestId(HEADING_KEY_TEST_ID);

        expect(focusedKey).toHaveAttribute(DATA_FOCUSED, 'true');

        await user.tab();

        const blurredKey = screen.getByTestId(HEADING_KEY_TEST_ID);

        expect(blurredKey).toHaveAttribute(DATA_FOCUSED, 'false');
      });

      it('shows the open list in the empty-lists specimen', async () => {
        const topicRow = within(card(EMPTY_LISTS)).getByRole('button', {
          name: /Topic page/,
        });
        await user.click(topicRow);

        const specimen = screen.getByTestId(
          `voice-specimen-${VOICE_SURFACE.ARCHIVE}`,
        );
        const sampleMessage = within(specimen).getByText(
          'No posts in Design yet.',
        );

        expect(sampleMessage).toBeVisible();
      });

      it.each([
        [PAGE_NOT_FOUND, 'The return button is fixed and translated for you.'],
        [ERROR_PAGE, 'The buttons are fixed and translated for you.'],
        [
          EMPTY_LISTS,
          'The heading comes from Studio; only the message is yours here.',
        ],
        [BOOKMARKS, 'The page title and panel heading are fixed.'],
      ])(
        'labels the %s preview with the text that is theirs',
        (surface, note) => {
          const preview = within(card(surface)).getByRole('group', {
            name: 'Live preview',
          });
          const noteText = within(preview).getByText(note);

          expect(noteText).toBeVisible();
        },
      );

      it('toggles each preview behind its own Show preview button', async () => {
        const toggle = within(card(BOOKMARKS)).getByRole('button', {
          name: SHOW_PREVIEW,
          expanded: false,
        });
        await user.click(toggle);

        const hideButton = within(card(BOOKMARKS)).getByRole('button', {
          name: 'Hide preview',
          expanded: true,
        });
        const errorShowButton = within(card(ERROR_PAGE)).getByRole('button', {
          name: SHOW_PREVIEW,
          expanded: false,
        });

        expect(hideButton).toBeVisible();
        expect(errorShowButton).toBeVisible();
      });
    });
  });

  describe('empty lists', () => {
    beforeEach(async () => {
      setup();
      await openVoiceSections(user);
    });

    it('opens one list at a time, showing the others as compact rows', async () => {
      const section = card(EMPTY_LISTS);
      const blogIndexField = within(section).getByRole('textbox', {
        name: BLOG_INDEX_PAGE,
      });

      expect(blogIndexField).toBeVisible();

      for (const name of [
        /Topic page/,
        /Tag page/,
        /Topics index page/,
        /Tags index page/,
      ]) {
        const compactRow = within(section).getByRole('button', {
          name,
          expanded: false,
        });

        expect(compactRow).toBeVisible();
      }

      const tagRow = within(section).getByRole('button', { name: /Tag page/ });
      await user.click(tagRow);

      const tagField = within(section).getByRole('textbox', { name: TAG_PAGE });
      const closedBlogIndexField = within(section).queryByRole('textbox', {
        name: BLOG_INDEX_PAGE,
      });
      const blogIndexRow = within(section).getByRole('button', {
        name: /Blog index page/,
      });

      expect(tagField).toBeVisible();
      expect(closedBlogIndexField).not.toBeInTheDocument();
      expect(blogIndexRow).toHaveTextContent(
        SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty,
      );
    });

    it('keeps keyboard focus on a list row as it opens, then tabs in', async () => {
      const section = card(EMPTY_LISTS);
      const row = within(section).getByRole('button', { name: /Tag page/ });

      await user.pointer({ keys: '[MouseLeft>]', target: row });
      await user.keyboard('{Enter}');

      expect(row).toHaveFocus();
      expect(row).toHaveAttribute(ARIA_EXPANDED, 'true');

      await user.tab();

      const boldButton = within(section).getByRole('button', { name: 'Bold' });

      expect(boldButton).toHaveFocus();
    });

    it('titles the open list once, in its header', () => {
      const titles = within(card(EMPTY_LISTS)).getAllByText(BLOG_INDEX_PAGE);

      expect(titles).toHaveLength(1);
    });

    it('closes the open list from its header', async () => {
      const section = card(EMPTY_LISTS);
      const openRow = within(section).getByRole('button', {
        name: /Blog index page/,
        expanded: true,
      });
      await user.click(openRow);

      const closedRow = within(section).getByRole('button', {
        name: /Blog index page/,
        expanded: false,
      });

      expect(closedRow).toBeVisible();
    });

    it('asks the editor to keep the name placeholder on a topic message', async () => {
      const topicRow = screen.getByRole('button', { name: /Topic page/ });
      await user.click(topicRow);

      const hint = screen.getByText(
        (_, element) =>
          element?.tagName === 'SPAN' &&
          element.textContent === KEEP_NAME_PLACEHOLDER,
      );

      expect(hint).toBeVisible();
    });
  });

  describe('saving', () => {
    it('saves untouched rich fields exactly as stored, in every language', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      setupBilingual();
      await openVoiceSections(user);

      const headingField = notFoundHeading();
      await user.clear(headingField);
      await editHeadingAndSave(MOCK_TYPED_TEXT);

      expect(saveVoiceOverridesActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        {
          [EN]: {
            notFoundHeading: MOCK_TYPED_TEXT,
            notFoundSupportingText: storedOverrides[EN].notFoundSupportingText,
            bookmarksEmpty: storedOverrides[EN].bookmarksEmpty,
          },
          [DE]: {
            localeErrorDescription: storedOverrides[DE].localeErrorDescription,
          },
        },
      );
    });

    it('makes the page content inert while the phone footer keeps focus on Saving…', async () => {
      saveVoiceOverridesActionMock.mockReturnValueOnce(new Promise(() => {}));
      setup();
      await openVoiceSections(user);

      await user.type(notFoundHeading(), MOCK_TYPED_TEXT);

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
      setup();
      await openVoiceSections(user);

      await editHeadingAndSave(MOCK_TYPED_TEXT);

      const toast = await screen.findByText('Voice saved.');

      expect(toast).toBeVisible();
      expect(refresh).toHaveBeenCalled();
    });

    it('shows an error alert and does not refresh when the save fails', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();
      await openVoiceSections(user);

      await editHeadingAndSave(MOCK_TYPED_TEXT);

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent("Couldn't save");
      expect(refresh).not.toHaveBeenCalled();
    });

    it('shows a rejected field inline until the editor changes it', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [EN]: { notFoundHeading: tooLong } },
      });
      setup();
      await openVoiceSections(user);

      await editHeadingAndSave(MOCK_TYPED_TEXT);

      const fieldError = await screen.findByText(TOO_LONG_MESSAGE);
      const rejectedField = notFoundHeading();
      const alert = screen.queryByRole('alert');
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const firstFieldLink = within(saveBar).getByRole('link');

      expect(fieldError).toBeVisible();
      expect(rejectedField).toHaveAccessibleDescription(
        `${en.voiceFieldHints.notFoundHeading} ${TOO_LONG_MESSAGE}`,
      );
      expect(alert).not.toBeInTheDocument();
      expect(saveBar).toHaveTextContent('1 field needs attention');
      expect(firstFieldLink).toHaveAttribute(HREF, `#${rejectedField.id}`);

      await user.type(rejectedField, MOCK_EDIT_TEXT);

      const clearedError = screen.queryByText(TOO_LONG_MESSAGE);

      expect(clearedError).not.toBeInTheDocument();
    });

    it('opens the language and list that hold a rejected field', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [DE]: { tagEmpty: missingName } },
      });
      setupBilingual();
      await openVoiceSections(user);

      await editHeadingAndSave(MOCK_EDIT_TEXT);

      const fieldError = await screen.findByText(
        'Keep the placeholder {name} — the site fills it in.',
      );
      const tagField = within(card(EMPTY_LISTS)).getByRole('textbox', {
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
            [EN]: { notFoundHeading: tooLong },
            [DE]: { notFoundHeading: tooLong },
          },
        });
        setupBilingual();
        await openVoiceSections(user);

        await editHeadingAndSave(MOCK_EDIT_TEXT);

        const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });

        expect(saveBar).toHaveTextContent('2 fields need attention');
      });

      it('goes to the first rejected field in page order', async () => {
        saveVoiceOverridesActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [EN]: { blogListEmpty: missingName, notFoundHeading: tooLong },
          },
        });
        setup();
        await openVoiceSections(user);

        await editHeadingAndSave(MOCK_TYPED_TEXT);
        await goToFirstRejectedField();

        const focusedField = notFoundHeading();

        expect(focusedField).toHaveFocus();
      });

      it('opens an earlier rejected list in place of the open one', async () => {
        saveVoiceOverridesActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [EN]: { topicEmpty: missingName, tagEmpty: missingName },
          },
        });
        setup();
        await openVoiceSections(user);

        const section = card(EMPTY_LISTS);
        const tagRow = within(section).getByRole('button', {
          name: /Tag page/,
        });
        await user.click(tagRow);
        await editHeadingAndSave(MOCK_TYPED_TEXT);
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
        setupBilingual();
        await openVoiceSections(user);

        await editHeadingAndSave(MOCK_EDIT_TEXT);

        const englishRadio = screen.getByRole('radio', { name: ENGLISH });
        await user.click(englishRadio);
        await goToFirstRejectedField();

        const germanLabel = activeLanguageLabel(GERMAN);
        const tagField = within(card(EMPTY_LISTS)).getByRole('textbox', {
          name: TAG_PAGE,
        });

        expect(germanLabel).toBeVisible();
        expect(tagField).toHaveFocus();
      });
    });
  });

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(async () => {
        setup({ archivedAt: MOCK_ARCHIVED_AT });
        await openVoiceSections(user);
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('describes every open control with the archived notice', async () => {
        const tagRow = within(card(EMPTY_LISTS)).getByRole('button', {
          name: /Tag page/,
        });
        await user.click(tagRow);

        const textboxes = screen.getAllByRole('textbox');

        for (const textbox of textboxes) {
          expect(textbox).toHaveAccessibleDescription(
            new RegExp(`^${ARCHIVED_NOTICE_DESCRIPTION}`),
          );
        }
      });
    });

    it('reads the archived notice between the language switcher and the note', () => {
      setupBilingual({ archivedAt: MOCK_ARCHIVED_AT });

      const switcher = screen.getByRole('radiogroup', { name: LANGUAGE });
      const notice = screen.getByText(ARCHIVED_NOTICE_TEXT);
      const note = screen.getByRole('note');

      expect(switcher.compareDocumentPosition(notice)).toBe(FOLLOWS);
      expect(notice.compareDocumentPosition(note)).toBe(FOLLOWS);
    });

    it('makes the text fields read-only and offers no Reset', async () => {
      setupBilingual({ archivedAt: MOCK_ARCHIVED_AT });
      await openVoiceSections(user);

      const headingField = notFoundHeading();
      const resetButton = screen.queryByRole('button', { name: RESET });

      expect(headingField).toHaveAttribute('readonly');
      expect(resetButton).not.toBeInTheDocument();
    });

    it('keeps the language switcher operable', async () => {
      setupBilingual({ archivedAt: MOCK_ARCHIVED_AT });
      await openVoiceSections(user);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const germanLabel = activeLanguageLabel(GERMAN);

      expect(germanRadio).toBeChecked();
      expect(germanLabel).toBeVisible();
    });
  });

  describe('sections', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      window.history.replaceState(null, '', window.location.pathname);
    });

    it('starts with every section collapsed, each header controlling its body', () => {
      setup();

      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);
      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);
      const cards = screen.queryAllByRole('heading', { level: 3 });

      expect(errorPages).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(errorPages).toHaveAttribute(ARIA_CONTROLS, ERROR_PAGES_BODY_ID);
      expect(emptyStates).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(emptyStates).toHaveAttribute(ARIA_CONTROLS, EMPTY_STATES_BODY_ID);
      expect(cards).toHaveLength(0);
    });

    it('names each section by its heading', () => {
      setup();

      const errorPages = screen.getByRole('region', {
        name: /^Error pages/,
      });
      const heading = within(errorPages).getByRole('heading', { level: 2 });

      expect(heading).toHaveTextContent(ERROR_PAGES_SECTION);
    });

    it('lists a collapsed section as links to its cards with their counts', () => {
      setupBilingual();

      const notFound = summaryRow(PAGE_NOT_FOUND);
      const errorPage = summaryRow(ERROR_PAGE);
      const lists = summaryRow(EMPTY_LISTS);
      const bookmarks = summaryRow(BOOKMARKS);

      expect(notFound).toHaveAttribute(HREF, '#s-notfound');
      expect(notFound).toHaveTextContent('3 fields');
      expect(notFound).toHaveTextContent('Customised');
      expect(errorPage).toHaveAttribute(HREF, '#s-error');
      expect(errorPage).toHaveTextContent('2 fields');
      expect(errorPage).toHaveTextContent('Default');
      expect(lists).toHaveAttribute(HREF, LISTS_HASH);
      expect(lists).toHaveTextContent('5 lists');
      expect(bookmarks).toHaveAttribute(HREF, BOOKMARKS_HASH);
      expect(bookmarks).toHaveTextContent('1 field');
    });

    it('sums each section meta from its cards', () => {
      setupBilingual();

      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);
      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);

      expect(errorPages).toHaveTextContent('5 fields · 2 customised');
      expect(emptyStates).toHaveTextContent('6 fields · 1 customised');
    });

    it('reads all default for a section nothing in is customised', () => {
      setup();

      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);

      expect(errorPages).toHaveTextContent(ERROR_PAGES_ALL_DEFAULT);
    });

    it('counts an unsaved edit at once and drops it again on Reset', async () => {
      setup();
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      await user.type(notFoundHeading(), MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
        '5 fields · 1 customised',
      );

      const resetButton = within(card(PAGE_NOT_FOUND)).getByRole('button', {
        name: RESET,
      });
      await user.click(resetButton);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
        ERROR_PAGES_ALL_DEFAULT,
      );
    });

    it('opens a section from its header and shows its cards', async () => {
      setup();

      await user.click(voiceSectionHeader(EMPTY_STATES_SECTION));

      const emptyStates = voiceSectionHeader(EMPTY_STATES_SECTION);
      const lists = card(EMPTY_LISTS);
      const errorPages = voiceSectionHeader(ERROR_PAGES_SECTION);

      expect(emptyStates).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(lists).toBeVisible();
      expect(errorPages).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('jumps from a summary row to its card, focusing the card heading', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      setup();

      await user.click(summaryRow(BOOKMARKS));

      const bookmarks = card(BOOKMARKS);
      const heading = within(bookmarks).getByRole('heading', { level: 3 });

      expect(voiceSectionHeader(EMPTY_STATES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(heading).toHaveFocus();
      expect(heading).toHaveAttribute('tabindex', '-1');
      expect(scrollIntoView).toHaveBeenLastCalledWith(SCROLL_TO_START);
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(bookmarks);
      expect(window.location.hash).toBe(BOOKMARKS_HASH);
    });

    it('jumps from a summary row with Enter', async () => {
      setup();

      summaryRow(PAGE_NOT_FOUND).focus();
      await user.keyboard('{Enter}');

      const heading = within(card(PAGE_NOT_FOUND)).getByRole('heading', {
        level: 3,
      });

      expect(heading).toHaveFocus();
    });

    it('jumps instantly with reduced motion', async () => {
      stubMatchingMediaQuery(MEDIA_QUERY.REDUCED_MOTION);
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      setup();

      await user.click(summaryRow(ERROR_PAGE));

      expect(scrollIntoView).toHaveBeenLastCalledWith({
        ...SCROLL_TO_START,
        behavior: 'instant',
      });
    });

    it.each([
      [LISTS_HASH, EMPTY_STATES_SECTION, EMPTY_LISTS],
      ['#sec-errors', ERROR_PAGES_SECTION, PAGE_NOT_FOUND],
    ])(
      'opens and scrolls to what a first-load %s hash points into',
      (hash, section, cardName) => {
        window.history.replaceState(null, '', hash);
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
        setup();

        const header = voiceSectionHeader(section);
        const shownCard = card(cardName);

        expect(header).toHaveAttribute(ARIA_EXPANDED, 'true');
        expect(shownCard).toBeVisible();
        expect(scrollIntoView).toHaveBeenCalledWith(SCROLL_TO_START);
      },
    );

    it('keeps sections open across a language switch', async () => {
      setupBilingual();
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

    it('keeps sections open after a save', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      setup();
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      await editHeadingAndSave(MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
    });

    it('shows a section with a rejected field as needing attention', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [EN]: { notFoundHeading: tooLong } },
      });
      setup();
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      await editHeadingAndSave(MOCK_EDIT_TEXT);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveTextContent(
        '5 fields · 1 field needs attention',
      );
    });

    it('opens the collapsed section that holds a rejected field', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: { [EN]: { notFoundHeading: tooLong } },
      });
      setup();
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));
      await user.type(notFoundHeading(), MOCK_EDIT_TEXT);
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const saveButton = within(saveBar).getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveButton);

      expect(voiceSectionHeader(ERROR_PAGES_SECTION)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
      expect(notFoundHeading()).toBeVisible();
    });

    it('keeps section headers and summary rows operable for an archived tenant', async () => {
      setup({ archivedAt: MOCK_ARCHIVED_AT });

      await user.click(summaryRow(EMPTY_LISTS));
      await user.click(voiceSectionHeader(ERROR_PAGES_SECTION));

      expect(card(EMPTY_LISTS)).toBeVisible();
      expect(card(PAGE_NOT_FOUND)).toBeVisible();
    });
  });
});
