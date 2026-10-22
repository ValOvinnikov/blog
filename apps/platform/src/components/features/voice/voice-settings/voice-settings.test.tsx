import {
  ACTION_OUTCOME,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_ERROR,
  type TVoicePortableText,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { saveVoiceOverridesAction } from '@platform/server/site-config/save-voice-overrides-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import userEvent from '@testing-library/user-event';

import { VoiceSettings, type TVoiceSettingsProps } from './voice-settings';

const tooLong = {
  reason: VOICE_FIELD_ERROR.TOO_LONG,
  values: { max: 100 },
};

const missingName = {
  reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
  values: { placeholders: '{name}', count: 1 },
};

vi.mock('@platform/server/site-config/save-voice-overrides-action', () => ({
  saveVoiceOverridesAction: vi.fn(),
}));

const saveVoiceOverridesActionMock = vi.mocked(saveVoiceOverridesAction);

mockRouterRefresh();

const { EN, DE } = LOCALE_ISO_CODES;
const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');

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

const NOTHING_HERE = 'Nothing here';

const storedOverrides = {
  [EN]: {
    notFoundHeading: NOTHING_HERE,
    notFoundSupportingText: richText('Wandered off', 'en-nf'),
    bookmarksEmpty: richText('Save a post', 'en-bm'),
  },
  [DE]: { localeErrorDescription: richText('Hoppla', 'de-err') },
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
  tenantId: TENANT_ID,
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

const notFoundHeading = () =>
  within(card(PAGE_NOT_FOUND)).getByRole('textbox', { name: 'Heading' });

const ERROR_PAGE = 'Error page';
const EMPTY_LISTS = 'Empty lists';
const VOICE_SPECIMEN_NOT_FOUND = 'voice-specimen-NOT_FOUND';
const LOST_AT_SEA = 'Lost at sea';
const VOICE_KEY_NOTFOUNDHEADING = 'voice-key-notFoundHeading';
const DATA_FOCUSED = 'data-focused';
const SHOW_PREVIEW = 'Show preview';
const BLOG_INDEX_PAGE = 'Blog index page';
const UNSAVED_CHANGES = 'Unsaved changes';
const SAVE_CHANGES = 'Save changes';
const USE_100_CHARACTERS_OR_FEWER = 'Use 100 characters or fewer.';

describe(`<${VoiceSettings.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows one card per surface, in page order', () => {
    setup();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([PAGE_NOT_FOUND, ERROR_PAGE, EMPTY_LISTS, 'Bookmarks']);
  });

  it('offers every field with its default as the placeholder', () => {
    setup();

    expect(notFoundHeading()).toHaveAttribute(
      'placeholder',
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
    expect(
      within(card(PAGE_NOT_FOUND)).getByRole('textbox', {
        name: 'Supporting text',
      }),
    ).toBeVisible();
    expect(
      within(card(ERROR_PAGE)).getByRole('textbox', { name: 'Description' }),
    ).toBeVisible();
    expect(
      within(card('Bookmarks')).getByRole('textbox', {
        name: 'Empty bookmarks',
      }),
    ).toBeVisible();
  });

  it('tells the editor that buttons and labels are not editable here', () => {
    setup();

    expect(
      screen.getByText(/Buttons, menus and labels are translated for you/),
    ).toBeVisible();
  });

  it('marks an edited field customised and unsaved, and Reset returns it to the default', async () => {
    setup();
    const section = card(PAGE_NOT_FOUND);

    expect(within(section).getAllByText('Default')).toHaveLength(3);

    await user.type(notFoundHeading(), 'Lost');

    expect(within(section).getByText('Customised')).toBeVisible();
    expect(within(section).getByText('Unsaved')).toBeInTheDocument();
    expect(within(section).getByText('3 fields · 1 customised')).toBeVisible();

    await user.click(within(section).getByRole('button', { name: 'Reset' }));

    expect(notFoundHeading()).toHaveValue('');
    expect(within(section).getByText('3 fields · all default')).toBeVisible();
  });

  it('summarises each card with its field count and customised count', () => {
    setupBilingual();

    expect(
      within(card(PAGE_NOT_FOUND)).getByText('3 fields · 2 customised'),
    ).toBeVisible();
    expect(
      within(card(ERROR_PAGE)).getByText('2 fields · all default'),
    ).toBeVisible();
    expect(
      within(card('Bookmarks')).getByText('1 field · 1 customised'),
    ).toBeVisible();
  });

  it('counts the empty-list card in lists', () => {
    setup();

    expect(
      within(card(EMPTY_LISTS)).getByText('5 lists · all default'),
    ).toBeVisible();
  });

  describe('specimens', () => {
    it('switches every specimen to the dark ramp from the colour scheme control', async () => {
      setup({ previewTheme: { ...defaultLookFormValues(), accentHue: 28 } });

      await user.click(screen.getByRole('button', { name: 'Dark' }));

      expect(screen.getByTestId(VOICE_SPECIMEN_NOT_FOUND)).toHaveStyle({
        '--brand-primary-solid': 'oklch(0.7 0.16 28)',
      });
    });

    it('re-renders the specimen beside a field as the editor types', async () => {
      setup();

      await user.type(notFoundHeading(), LOST_AT_SEA);

      expect(
        within(screen.getByTestId(VOICE_SPECIMEN_NOT_FOUND)).getByText(
          LOST_AT_SEA,
        ),
      ).toBeVisible();
    });

    it("outlines the focused field's text in its specimen", async () => {
      setup();

      await user.click(notFoundHeading());

      expect(screen.getByTestId(VOICE_KEY_NOTFOUNDHEADING)).toHaveAttribute(
        DATA_FOCUSED,
        'true',
      );

      await user.tab();

      expect(screen.getByTestId(VOICE_KEY_NOTFOUNDHEADING)).toHaveAttribute(
        DATA_FOCUSED,
        'false',
      );
    });

    it('shows the open list in the empty-lists specimen', async () => {
      setup();
      const section = card(EMPTY_LISTS);

      await user.click(
        within(section).getByRole('button', { name: /Topic page/ }),
      );

      expect(
        within(screen.getByTestId('voice-specimen-ARCHIVE')).getByText(
          'No posts in Design yet.',
        ),
      ).toBeVisible();
    });

    it.each([
      [PAGE_NOT_FOUND, 'The return button is fixed and translated for you.'],
      [ERROR_PAGE, 'The buttons are fixed and translated for you.'],
      [
        EMPTY_LISTS,
        'The heading comes from Studio; only the message is yours here.',
      ],
      ['Bookmarks', 'The page title and panel heading are fixed.'],
    ])(
      'labels the %s preview and tells the editor which text is theirs',
      (surface, note) => {
        setup();
        const preview = within(card(surface)).getByRole('group', {
          name: 'Live preview',
        });

        expect(within(preview).getByText(note)).toBeInTheDocument();
      },
    );

    it('toggles each preview behind its own Show preview button', async () => {
      setup();
      const toggle = within(card('Bookmarks')).getByRole('button', {
        name: SHOW_PREVIEW,
        expanded: false,
      });

      await user.click(toggle);

      expect(
        within(card('Bookmarks')).getByRole('button', {
          name: 'Hide preview',
          expanded: true,
        }),
      ).toBeVisible();
      expect(
        within(card(ERROR_PAGE)).getByRole('button', {
          name: SHOW_PREVIEW,
          expanded: false,
        }),
      ).toBeVisible();
    });
  });

  describe('empty lists', () => {
    it('opens one list at a time, showing the others as compact rows', async () => {
      setup();
      const section = card(EMPTY_LISTS);

      expect(
        within(section).getByRole('textbox', { name: BLOG_INDEX_PAGE }),
      ).toBeVisible();
      for (const name of [
        /Topic page/,
        /Tag page/,
        /Topics index page/,
        /Tags index page/,
      ]) {
        expect(
          within(section).getByRole('button', { name, expanded: false }),
        ).toBeVisible();
      }

      await user.click(
        within(section).getByRole('button', { name: /Tag page/ }),
      );

      expect(
        within(section).getByRole('textbox', { name: 'Tag page' }),
      ).toBeVisible();
      expect(
        within(section).queryByRole('textbox', { name: BLOG_INDEX_PAGE }),
      ).not.toBeInTheDocument();
      expect(
        within(section).getByRole('button', { name: /Blog index page/ }),
      ).toHaveTextContent(SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty);
    });

    it('keeps keyboard focus on a list row as it opens, then tabs into its field', async () => {
      setup();
      const section = card(EMPTY_LISTS);
      const row = within(section).getByRole('button', { name: /Tag page/ });

      row.focus();
      await user.keyboard('{Enter}');

      expect(row).toHaveFocus();
      expect(row).toHaveAttribute('aria-expanded', 'true');

      await user.tab();

      expect(
        within(section).getByRole('button', { name: 'Bold' }),
      ).toHaveFocus();
    });

    it('titles the open list once, in its header', () => {
      setup();

      expect(
        within(card(EMPTY_LISTS)).getAllByText(BLOG_INDEX_PAGE),
      ).toHaveLength(1);
    });

    it('closes the open list from its header', async () => {
      setup();
      const section = card(EMPTY_LISTS);

      await user.click(
        within(section).getByRole('button', {
          name: /Blog index page/,
          expanded: true,
        }),
      );

      expect(
        within(section).getByRole('button', {
          name: /Blog index page/,
          expanded: false,
        }),
      ).toBeVisible();
    });

    it('asks the editor to keep the name placeholder on a topic message', async () => {
      setup();

      await user.click(screen.getByRole('button', { name: /Topic page/ }));

      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName === 'SPAN' &&
            element.textContent === 'Keep {name} — the site fills it in.',
        ),
      ).toBeVisible();
    });
  });

  describe('languages', () => {
    it('shows no language switcher for a single-language site', () => {
      setup();

      expect(
        screen.queryByRole('group', { name: 'Language' }),
      ).not.toBeInTheDocument();
    });

    it('describes each live language with its customised count, marking the default', () => {
      setupBilingual();

      const switcher = screen.getByRole('group', { name: 'Language' });
      expect(
        within(switcher).getByRole('button', { name: 'English' }),
      ).toHaveAccessibleDescription('Default language · 3 customised');
      expect(
        within(switcher).getByRole('button', { name: 'German' }),
      ).toHaveAccessibleDescription('1 customised');
    });

    it("edits the selected language's values against that language's defaults", async () => {
      setupBilingual();

      expect(notFoundHeading()).toHaveValue(NOTHING_HERE);

      await user.click(screen.getByRole('button', { name: 'German' }));

      expect(notFoundHeading()).toHaveValue('');
      expect(notFoundHeading()).toHaveAttribute(
        'placeholder',
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
      expect(screen.getByText('German', { selector: 'strong' })).toBeVisible();
    });

    it('breaks the unsaved count down by language', async () => {
      setupBilingual();

      await user.type(notFoundHeading(), '!');
      await user.click(screen.getByRole('button', { name: 'German' }));
      await user.type(notFoundHeading(), 'Weg');

      expect(
        screen.getByRole('region', { name: UNSAVED_CHANGES }),
      ).toHaveTextContent('2 unsaved changesEnglish 1 · German 1');
    });
  });

  describe('saving', () => {
    it('leaves every untouched rich field exactly as stored, in every language', async () => {
      saveVoiceOverridesActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      setupBilingual();

      await user.clear(notFoundHeading());
      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(saveVoiceOverridesActionMock).toHaveBeenCalledWith(TENANT_ID, {
        [EN]: {
          notFoundHeading: 'Lost',
          notFoundSupportingText: storedOverrides[EN].notFoundSupportingText,
          bookmarksEmpty: storedOverrides[EN].bookmarksEmpty,
        },
        [DE]: {
          localeErrorDescription: storedOverrides[DE].localeErrorDescription,
        },
      });
    });

    it('shows a toast and refreshes after a successful save', async () => {
      const refresh = mockRouterRefresh();
      saveVoiceOverridesActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      setup();

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(await screen.findByText('Voice saved.')).toBeVisible();
      expect(refresh).toHaveBeenCalled();
    });

    it('shows an error alert and does not refresh when the save fails', async () => {
      const refresh = mockRouterRefresh();
      saveVoiceOverridesActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Couldn't save",
      );
      expect(refresh).not.toHaveBeenCalled();
    });

    it('shows a rejected field inline and counts it on the save bar until edited', async () => {
      saveVoiceOverridesActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {
          [EN]: {
            notFoundHeading: tooLong,
          },
        },
      });
      setup();

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(
        await screen.findByText(USE_100_CHARACTERS_OR_FEWER),
      ).toBeVisible();
      expect(notFoundHeading()).toHaveAccessibleDescription(
        /Use 100 characters or fewer\./,
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      expect(saveBar).toHaveTextContent('1 field needs attention');
      expect(within(saveBar).getByRole('link')).toHaveAttribute(
        'href',
        `#${notFoundHeading().id}`,
      );

      await user.type(notFoundHeading(), '!');

      expect(
        screen.queryByText(USE_100_CHARACTERS_OR_FEWER),
      ).not.toBeInTheDocument();
    });

    it('switches to the language and opens the list that holds a rejected field', async () => {
      saveVoiceOverridesActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {
          [DE]: { tagEmpty: missingName },
        },
      });
      setupBilingual();

      await user.type(notFoundHeading(), '!');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(
        await screen.findByText(
          'Keep the placeholder {name} — the site fills it in.',
        ),
      ).toBeVisible();
      expect(
        within(card(EMPTY_LISTS)).getByRole('textbox', { name: 'Tag page' }),
      ).toBeVisible();
      expect(screen.getByText('German', { selector: 'strong' })).toBeVisible();
    });

    describe('when fields are rejected', () => {
      const saveBar = () =>
        screen.getByRole('region', { name: UNSAVED_CHANGES });
      const goToFirstField = () =>
        user.click(
          within(saveBar()).getByRole('link', { name: 'Go to the first one' }),
        );

      it('counts a field rejected in two languages once per language', async () => {
        saveVoiceOverridesActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [EN]: {
              notFoundHeading: tooLong,
            },
            [DE]: { notFoundHeading: tooLong },
          },
        });
        setupBilingual();

        await user.type(notFoundHeading(), '!');
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

        expect(saveBar()).toHaveTextContent('2 fields need attention');
      });

      it('goes to the first rejected field in page order', async () => {
        saveVoiceOverridesActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [EN]: {
              blogListEmpty: missingName,
              notFoundHeading: tooLong,
            },
          },
        });
        setup();

        await user.type(notFoundHeading(), 'Lost');
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
        await goToFirstField();

        expect(notFoundHeading()).toHaveFocus();
      });

      it('opens an earlier rejected list in place of the open one', async () => {
        saveVoiceOverridesActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [EN]: {
              topicEmpty: missingName,
              tagEmpty: missingName,
            },
          },
        });
        setup();
        const section = card(EMPTY_LISTS);

        await user.click(
          within(section).getByRole('button', { name: /Tag page/ }),
        );
        await user.type(notFoundHeading(), 'Lost');
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
        await goToFirstField();

        expect(
          within(section).getByRole('textbox', { name: 'Topic page' }),
        ).toHaveFocus();
      });

      it('returns to the language that holds the first rejected field', async () => {
        saveVoiceOverridesActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrorsByLocale: {
            [DE]: {
              tagEmpty: missingName,
            },
          },
        });
        setupBilingual();

        await user.type(notFoundHeading(), '!');
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
        await user.click(screen.getByRole('button', { name: 'English' }));
        await goToFirstField();

        expect(
          screen.getByText('German', { selector: 'strong' }),
        ).toBeVisible();
        expect(
          within(card(EMPTY_LISTS)).getByRole('textbox', {
            name: 'Tag page',
          }),
        ).toHaveFocus();
      });
    });
  });

  it('restores the saved values on Discard', async () => {
    setupBilingual();

    await user.clear(notFoundHeading());

    expect(
      screen.getByRole('region', { name: UNSAVED_CHANGES }),
    ).toHaveTextContent('1 unsaved change');

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(notFoundHeading()).toHaveValue(NOTHING_HERE);
  });

  describe('archived tenant', () => {
    it('shows an archived notice and offers no Save', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expectArchivedOffersNoSave();
    });

    it('describes every control with the archived notice', async () => {
      setup({ archivedAt: ARCHIVED_AT });

      await user.click(
        within(card(EMPTY_LISTS)).getByRole('button', { name: /Tag page/ }),
      );

      for (const textbox of screen.getAllByRole('textbox')) {
        expect(textbox).toHaveAccessibleDescription(/This tenant is archived/);
      }
    });

    it('makes the text fields read-only and offers no Reset', () => {
      setupBilingual({ archivedAt: ARCHIVED_AT });

      expect(notFoundHeading()).toHaveAttribute('readonly');
      expect(
        screen.queryByRole('button', { name: 'Reset' }),
      ).not.toBeInTheDocument();
    });
  });
});
