import { SITE_MESSAGES_BY_LOCALE, VOICE_SURFACE } from '@blog/config';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { ARIA_CONTROLS, ARIA_EXPANDED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ARCHIVED_NOTICE_TEXT,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_ARCHIVED_AT } from '@platform/testing/tenants/fixtures';
import {
  BLOG_INDEX_ROW,
  NOTHING_HERE,
  TAG_ROW,
  TOPIC_ROW,
  UNSAVED_MARK,
} from '@platform/testing/voice/fixtures';
import { openVoiceSections } from '@platform/testing/voice/sections';
import {
  BOOKMARKS,
  EMPTY_LISTS,
  ERROR_PAGE,
  PAGE_NOT_FOUND,
  notFoundHeadingField,
  setupBilingualVoiceSettings,
  setupVoiceSettings,
  voiceCard,
  GERMAN,
  NO_OVERRIDES,
  RESET,
  TWO_LANGUAGES,
  activeLanguageLabel,
  setupBilingualVoiceSettingsWithSectionsOpen,
  setupVoiceSettingsWithSectionsOpen,
} from '@platform/testing/voice/voice-settings-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

faker.seed(5994);

const MOCK_ACCENT_HUE = 28;
const MOCK_TYPED_TEXT = faker.lorem.words(2);
const MOCK_EDIT_TEXT = faker.lorem.word();
const MOCK_EDIT_TEXT_DE = faker.lorem.word();

const KEEP_NAME_PLACEHOLDER = 'Keep {name} — the site fills it in.';

vi.mock('@platform/server/site-config/save-voice-overrides-action');

const ENGLISH = 'English';
const LANGUAGE = 'Language';
const TAG_PAGE = 'Tag page';
const BLOG_INDEX_PAGE = 'Blog index page';
const SHOW_PREVIEW = 'Show preview';
const PREVIEW = 'Preview';
const ERROR_PAGE_NOTE = 'The buttons are fixed and translated for you.';
const HEADING_KEY_TEST_ID = 'voice-key-notFoundHeading';
const DATA_FOCUSED = 'data-focused';
const FOLLOWS = Node.DOCUMENT_POSITION_FOLLOWING;

const previewColorSchemeGroup = () =>
  screen.getByRole('group', {
    name: en.previewModeControl.previewColorSchemeAriaLabel,
  });

describe(`<${VoiceSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  describe(NO_OVERRIDES, () => {
    beforeEach(async () => {
      await setupVoiceSettingsWithSectionsOpen(user);
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

    it('shows every field at its default as the control value', async () => {
      const headingField = notFoundHeadingField();
      const eyebrow = within(voiceCard(PAGE_NOT_FOUND)).getByRole('textbox', {
        name: 'Eyebrow',
      });
      const errorHeading = within(voiceCard(ERROR_PAGE)).getByRole('textbox', {
        name: 'Heading',
      });
      const supportingText = await within(voiceCard(PAGE_NOT_FOUND)).findByRole(
        'textbox',
        { name: 'Supporting text' },
      );
      const emptyBookmarks = await within(voiceCard(BOOKMARKS)).findByRole(
        'textbox',
        { name: 'Empty bookmarks' },
      );

      expect(headingField).toHaveValue(
        SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
      );
      expect(eyebrow).toHaveValue(SITE_MESSAGES_BY_LOCALE.EN.notFound.eyebrow);
      expect(errorHeading).toHaveValue(
        SITE_MESSAGES_BY_LOCALE.EN.localeErrorPage.title,
      );
      expect(supportingText).toHaveTextContent(
        SITE_MESSAGES_BY_LOCALE.EN.notFound.supportingText,
      );
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
      const section = voiceCard(PAGE_NOT_FOUND);
      const defaultBadges = within(section).getAllByText('Default');

      expect(defaultBadges).toHaveLength(3);

      const headingField = notFoundHeadingField();
      await user.clear(headingField);
      await user.type(headingField, MOCK_TYPED_TEXT);

      const customisedBadge = within(section).getByText('Customised');
      const unsavedBadge = within(section).getByRole('img', {
        name: UNSAVED_MARK,
      });
      const customisedSummary = within(section).getByText(
        '3 fields · 1 customised',
      );

      expect(customisedBadge).toBeVisible();
      expect(unsavedBadge).toBeVisible();
      expect(customisedSummary).toBeVisible();

      const resetButton = within(section).getByRole('button', { name: RESET });
      await user.click(resetButton);

      const resetHeadingField = notFoundHeadingField();
      const defaultSummary = within(section).getByText(
        '3 fields · all default',
      );

      expect(resetHeadingField).toHaveValue(
        SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
      );
      expect(defaultSummary).toBeVisible();
    });

    it('counts the empty-list card in lists', () => {
      const listsSummary = within(voiceCard(EMPTY_LISTS)).getByText(
        '5 lists · all default',
      );

      expect(listsSummary).toBeVisible();
    });
  });

  describe(TWO_LANGUAGES, () => {
    beforeEach(async () => {
      await setupBilingualVoiceSettingsWithSectionsOpen(user);
    });

    it('summarises each card with its field count and customised count', () => {
      const notFoundSummary = within(voiceCard(PAGE_NOT_FOUND)).getByText(
        '3 fields · 2 customised',
      );
      const errorSummary = within(voiceCard(ERROR_PAGE)).getByText(
        '2 fields · all default',
      );
      const bookmarksSummary = within(voiceCard(BOOKMARKS)).getByText(
        '1 field · 1 customised',
      );

      expect(notFoundSummary).toBeVisible();
      expect(errorSummary).toBeVisible();
      expect(bookmarksSummary).toBeVisible();
    });

    it('restores the saved values on Discard', async () => {
      const headingField = notFoundHeadingField();
      await user.clear(headingField);

      const unsavedRegion = screen.getByRole('region', {
        name: UNSAVED_CHANGES,
      });

      expect(unsavedRegion).toHaveTextContent('1 unsaved change');

      const discardButton = screen.getByRole('button', { name: 'Discard' });
      await user.click(discardButton);

      const restoredHeadingField = notFoundHeadingField();

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
      const englishHeadingField = notFoundHeadingField();

      expect(englishHeadingField).toHaveValue(NOTHING_HERE);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const germanHeadingField = notFoundHeadingField();
      const germanLabel = activeLanguageLabel(GERMAN);

      expect(germanHeadingField).toHaveValue(
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
      expect(germanLabel).toBeVisible();
    });

    it('breaks the unsaved count down by language', async () => {
      const englishHeadingField = notFoundHeadingField();
      await user.type(englishHeadingField, MOCK_EDIT_TEXT);

      const germanRadio = screen.getByRole('radio', { name: GERMAN });
      await user.click(germanRadio);

      const germanHeadingField = notFoundHeadingField();
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
    setupVoiceSettings();

    const switcher = screen.queryByRole('radiogroup', { name: LANGUAGE });

    expect(switcher).not.toBeInTheDocument();
  });

  describe('specimens', () => {
    it('switches every specimen to the dark ramp from the colour scheme', async () => {
      setupVoiceSettings({
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
        await setupVoiceSettingsWithSectionsOpen(user);
      });

      it('re-renders the specimen beside a field as the editor types', async () => {
        const headingField = notFoundHeadingField();
        await user.clear(headingField);
        await user.type(headingField, MOCK_TYPED_TEXT);

        const specimen = screen.getByTestId(
          `voice-specimen-${VOICE_SURFACE.NOT_FOUND}`,
        );
        const typedText = within(specimen).getByText(MOCK_TYPED_TEXT);

        expect(typedText).toBeVisible();
      });

      it("outlines the focused field's text in its specimen", async () => {
        const headingField = notFoundHeadingField();
        await user.click(headingField);

        const focusedKey = screen.getByTestId(HEADING_KEY_TEST_ID);

        expect(focusedKey).toHaveAttribute(DATA_FOCUSED, 'true');

        await user.tab();

        const blurredKey = screen.getByTestId(HEADING_KEY_TEST_ID);

        expect(blurredKey).toHaveAttribute(DATA_FOCUSED, 'false');
      });

      it('shows the open list in the empty-lists specimen', async () => {
        const topicRow = within(voiceCard(EMPTY_LISTS)).getByRole('button', {
          name: TOPIC_ROW,
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
        [
          PAGE_NOT_FOUND,
          PREVIEW,
          'The return button is fixed and translated for you.',
        ],
        [ERROR_PAGE, PREVIEW, ERROR_PAGE_NOTE],
        [
          EMPTY_LISTS,
          `Preview · ${BLOG_INDEX_PAGE}`,
          'The heading comes from Studio; only the message is yours here.',
        ],
        [BOOKMARKS, PREVIEW, 'The page title and panel heading are fixed.'],
      ])(
        'labels the %s preview %s, with the text that is theirs',
        (surface, label, note) => {
          const preview = within(voiceCard(surface)).getByRole('group', {
            name: label,
          });
          const noteText = within(preview).getByText(note);

          expect(noteText).toBeVisible();
        },
      );

      it.each([PAGE_NOT_FOUND, ERROR_PAGE, BOOKMARKS])(
        'offers no Show preview button on the %s card',
        (surface) => {
          const toggle = within(voiceCard(surface)).queryByRole('button', {
            name: SHOW_PREVIEW,
          });

          expect(toggle).not.toBeInTheDocument();
        },
      );

      it('outlines no field in a card whose fields have no focus', () => {
        const keys = within(voiceCard(ERROR_PAGE)).getAllByTestId(
          /^voice-key-/,
        );
        const focusStates = keys.map((key) => key.getAttribute(DATA_FOCUSED));

        expect(focusStates).toEqual(keys.map(() => 'false'));
      });

      it('repeats the note under the last field of a field card', () => {
        const section = voiceCard(ERROR_PAGE);
        const preview = within(section).getByRole('group', { name: PREVIEW });
        const [closingNote] = within(section).getAllByText(ERROR_PAGE_NOTE);
        const lastField = within(section).getByRole('textbox', {
          name: 'Description',
        });

        expect(preview).not.toContainElement(closingNote!);
        expect(lastField.compareDocumentPosition(closingNote!)).toBe(FOLLOWS);
      });

      it('names the open list in the empty-lists preview label', async () => {
        const section = voiceCard(EMPTY_LISTS);
        const topicRow = within(section).getByRole('button', {
          name: TOPIC_ROW,
        });
        await user.click(topicRow);

        const preview = within(section).getByRole('group', {
          name: 'Preview · Topic page',
        });

        expect(preview).toBeInTheDocument();
      });

      it('names the first list in the preview label while no list is open', async () => {
        const section = voiceCard(EMPTY_LISTS);
        const openRow = within(section).getByRole('button', {
          name: BLOG_INDEX_ROW,
          expanded: true,
        });
        await user.click(openRow);

        const preview = within(section).getByRole('group', {
          name: `Preview · ${BLOG_INDEX_PAGE}`,
        });

        expect(preview).toBeInTheDocument();
      });

      it('toggles the empty-lists preview and keeps focus on its button', async () => {
        const toggle = within(voiceCard(EMPTY_LISTS)).getByRole('button', {
          name: SHOW_PREVIEW,
          expanded: false,
        });
        await user.click(toggle);

        const preview = within(voiceCard(EMPTY_LISTS)).getByRole('group', {
          name: `Preview · ${BLOG_INDEX_PAGE}`,
        });

        expect(toggle).toHaveAttribute(ARIA_CONTROLS, preview.id);
        expect(toggle).toHaveFocus();
        expect(toggle).toHaveAccessibleName('Hide preview');
        expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');

        await user.click(toggle);

        expect(toggle).toHaveAccessibleName(SHOW_PREVIEW);
        expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
      });

      it.each([PAGE_NOT_FOUND, ERROR_PAGE, BOOKMARKS])(
        'offers no Show preview on the %s card',
        (surface) => {
          const toggle = within(voiceCard(surface)).queryByRole('button', {
            name: SHOW_PREVIEW,
          });

          expect(toggle).not.toBeInTheDocument();
        },
      );
    });
  });

  describe('empty lists', () => {
    beforeEach(async () => {
      await setupVoiceSettingsWithSectionsOpen(user);
    });

    it('opens one list at a time, showing the others as compact rows', async () => {
      const section = voiceCard(EMPTY_LISTS);
      const blogIndexField = within(section).getByRole('textbox', {
        name: BLOG_INDEX_PAGE,
      });

      expect(blogIndexField).toBeVisible();

      for (const name of [
        TOPIC_ROW,
        TAG_ROW,
        /Topics index page/,
        /Tags index page/,
      ]) {
        const compactRow = within(section).getByRole('button', {
          name,
          expanded: false,
        });

        expect(compactRow).toBeVisible();
      }

      const tagRow = within(section).getByRole('button', { name: TAG_ROW });
      await user.click(tagRow);

      const tagField = within(section).getByRole('textbox', { name: TAG_PAGE });
      const closedBlogIndexField = within(section).queryByRole('textbox', {
        name: BLOG_INDEX_PAGE,
      });
      const blogIndexRow = within(section).getByRole('button', {
        name: BLOG_INDEX_ROW,
      });

      expect(tagField).toBeVisible();
      expect(closedBlogIndexField).not.toBeInTheDocument();
      expect(blogIndexRow).toHaveTextContent(
        SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty,
      );
    });

    it('keeps keyboard focus on a list row as it opens, then tabs in', async () => {
      const section = voiceCard(EMPTY_LISTS);
      const row = within(section).getByRole('button', { name: TAG_ROW });

      await user.pointer({ keys: '[MouseLeft>]', target: row });
      await user.keyboard('{Enter}');

      expect(row).toHaveFocus();
      expect(row).toHaveAttribute(ARIA_EXPANDED, 'true');

      await user.tab();

      const boldButton = within(section).getByRole('button', { name: 'Bold' });

      expect(boldButton).toHaveFocus();
    });

    it('titles the open list once, in its header', () => {
      const titles = within(voiceCard(EMPTY_LISTS)).getAllByText(
        BLOG_INDEX_PAGE,
      );

      expect(titles).toHaveLength(1);
    });

    it('closes the open list from its header', async () => {
      const section = voiceCard(EMPTY_LISTS);
      const openRow = within(section).getByRole('button', {
        name: BLOG_INDEX_ROW,
        expanded: true,
      });
      await user.click(openRow);

      const closedRow = within(section).getByRole('button', {
        name: BLOG_INDEX_ROW,
        expanded: false,
      });

      expect(closedRow).toBeVisible();
    });

    it('asks the editor to keep the name placeholder on a topic message', async () => {
      const topicRow = screen.getByRole('button', { name: TOPIC_ROW });
      await user.click(topicRow);

      const hint = screen.getByText(
        (_, element) =>
          element?.tagName === 'SPAN' &&
          element.textContent === KEEP_NAME_PLACEHOLDER,
      );

      expect(hint).toBeVisible();
    });
  });

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(async () => {
        await setupVoiceSettingsWithSectionsOpen(user, {
          archivedAt: MOCK_ARCHIVED_AT,
        });
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('describes every open control with the archived notice', async () => {
        const tagRow = within(voiceCard(EMPTY_LISTS)).getByRole('button', {
          name: TAG_ROW,
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
      setupBilingualVoiceSettings({ archivedAt: MOCK_ARCHIVED_AT });

      const switcher = screen.getByRole('radiogroup', { name: LANGUAGE });
      const notice = screen.getByText(ARCHIVED_NOTICE_TEXT);
      const note = screen.getByRole('note');

      expect(switcher.compareDocumentPosition(notice)).toBe(FOLLOWS);
      expect(notice.compareDocumentPosition(note)).toBe(FOLLOWS);
    });

    describe('in two live languages, with every section open', () => {
      beforeEach(async () => {
        await setupBilingualVoiceSettingsWithSectionsOpen(user, {
          archivedAt: MOCK_ARCHIVED_AT,
        });
      });

      it('makes the text fields read-only and offers no Reset', async () => {
        const headingField = notFoundHeadingField();
        const resetButton = screen.queryByRole('button', { name: RESET });

        expect(headingField).toHaveAttribute('readonly');
        expect(resetButton).not.toBeInTheDocument();
      });

      it('keeps the language switcher operable', async () => {
        const germanRadio = screen.getByRole('radio', { name: GERMAN });
        await user.click(germanRadio);

        const germanLabel = activeLanguageLabel(GERMAN);

        expect(germanRadio).toBeChecked();
        expect(germanLabel).toBeVisible();
      });
    });
  });
});
