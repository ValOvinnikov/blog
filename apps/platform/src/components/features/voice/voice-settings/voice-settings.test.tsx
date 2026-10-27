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
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { NOTHING_HERE } from '@platform/testing/voice/fixtures';
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

const notFoundHeading = () =>
  within(card(PAGE_NOT_FOUND)).getByRole('textbox', { name: 'Heading' });

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

    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
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
    beforeEach(() => {
      setup();
    });

    it('shows one card per surface, in page order', () => {
      const headings = screen.getAllByRole('heading', { level: 2 });
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

    it('tells the editor that buttons and labels are not editable here', () => {
      const note = screen.getByText(
        /Buttons, menus and labels are translated for you/,
      );

      expect(note).toBeVisible();
    });

    it('marks an edited field customised and unsaved until Reset', async () => {
      const section = card(PAGE_NOT_FOUND);
      const defaultBadges = within(section).getAllByText('Default');

      expect(defaultBadges).toHaveLength(3);

      const headingField = notFoundHeading();
      await user.type(headingField, MOCK_TYPED_TEXT);

      const customisedBadge = within(section).getByText('Customised');
      const unsavedBadge = within(section).getByText('Unsaved');
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
    beforeEach(() => {
      setupBilingual();
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

    it('describes each live language, marking the default', () => {
      const switcher = screen.getByRole('group', { name: LANGUAGE });
      const englishButton = within(switcher).getByRole('button', {
        name: ENGLISH,
      });
      const germanButton = within(switcher).getByRole('button', {
        name: GERMAN,
      });

      expect(englishButton).toHaveAccessibleDescription(
        'Default language · 3 customised',
      );
      expect(germanButton).toHaveAccessibleDescription('1 customised');
    });

    it("edits the selected language against that language's defaults", async () => {
      const englishHeadingField = notFoundHeading();

      expect(englishHeadingField).toHaveValue(NOTHING_HERE);

      const germanButton = screen.getByRole('button', { name: GERMAN });
      await user.click(germanButton);

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

      const germanButton = screen.getByRole('button', { name: GERMAN });
      await user.click(germanButton);

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

    const switcher = screen.queryByRole('group', { name: LANGUAGE });

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
      beforeEach(() => {
        setup();
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
    beforeEach(() => {
      setup();
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
      expect(row).toHaveAttribute('aria-expanded', 'true');

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

    it('shows a toast and refreshes after a successful save', async () => {
      saveVoiceOverridesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      setup();

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
      setupBilingual();

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

        await editHeadingAndSave(MOCK_EDIT_TEXT);

        const englishButton = screen.getByRole('button', { name: ENGLISH });
        await user.click(englishButton);
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
      beforeEach(() => {
        setup({ archivedAt: MOCK_ARCHIVED_AT });
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

    it('makes the text fields read-only and offers no Reset', () => {
      setupBilingual({ archivedAt: MOCK_ARCHIVED_AT });

      const headingField = notFoundHeading();
      const resetButton = screen.queryByRole('button', { name: RESET });

      expect(headingField).toHaveAttribute('readonly');
      expect(resetButton).not.toBeInTheDocument();
    });
  });
});
