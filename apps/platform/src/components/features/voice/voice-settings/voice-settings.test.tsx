import { SITE_MESSAGES_BY_LOCALE, type TVoicePortableText } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import userEvent from '@testing-library/user-event';

import { VoiceSettings, type TVoiceSettingsProps } from './voice-settings';

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

const storedOverrides = {
  [EN]: {
    notFoundHeading: 'Nothing here',
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
  tenantId: 'tenant-1',
  initialDraft: buildVoiceDraft({}, [EN]),
  defaultLocale: EN,
  liveLocales: [EN],
  previewTheme: defaultLookFormValues(),
  saveAction: vi.fn(),
});

const setupBilingual = (overrides: Partial<TVoiceSettingsProps> = {}) =>
  setup({
    initialDraft: buildVoiceDraft(storedOverrides, [EN, DE]),
    liveLocales: [EN, DE],
    ...overrides,
  });

const card = (name: string) => screen.getByRole('region', { name });

const notFoundHeading = () =>
  within(card('Page not found')).getByRole('textbox', { name: 'Heading' });

describe(`<${VoiceSettings.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows one card per surface, in page order', () => {
    setup();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Page not found', 'Error page', 'Empty lists', 'Bookmarks']);
  });

  it('offers every field with its default as the placeholder', () => {
    setup();

    expect(notFoundHeading()).toHaveAttribute(
      'placeholder',
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
    expect(
      within(card('Page not found')).getByRole('textbox', {
        name: 'Supporting text',
      }),
    ).toBeVisible();
    expect(
      within(card('Error page')).getByRole('textbox', { name: 'Description' }),
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
    const section = card('Page not found');

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
      within(card('Page not found')).getByText('3 fields · 2 customised'),
    ).toBeVisible();
    expect(
      within(card('Error page')).getByText('2 fields · all default'),
    ).toBeVisible();
    expect(
      within(card('Bookmarks')).getByText('1 field · 1 customised'),
    ).toBeVisible();
  });

  it('counts the empty-list card in lists', () => {
    setup();

    expect(
      within(card('Empty lists')).getByText('5 lists · all default'),
    ).toBeVisible();
  });

  describe('specimens', () => {
    it('re-renders the specimen beside a field as the editor types', async () => {
      setup();

      await user.type(notFoundHeading(), 'Lost at sea');

      expect(
        within(screen.getByTestId('voice-specimen-NOT_FOUND')).getByText(
          'Lost at sea',
        ),
      ).toBeVisible();
    });

    it("outlines the focused field's text in its specimen", async () => {
      setup();

      await user.click(notFoundHeading());

      expect(screen.getByTestId('voice-key-notFoundHeading')).toHaveAttribute(
        'data-focused',
        'true',
      );

      await user.tab();

      expect(screen.getByTestId('voice-key-notFoundHeading')).toHaveAttribute(
        'data-focused',
        'false',
      );
    });

    it('shows the open list in the empty-lists specimen', async () => {
      setup();
      const section = card('Empty lists');

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
      ['Page not found', 'The return button is fixed and translated for you.'],
      ['Error page', 'The buttons are fixed and translated for you.'],
      [
        'Empty lists',
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
        name: 'Show preview',
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
        within(card('Error page')).getByRole('button', {
          name: 'Show preview',
          expanded: false,
        }),
      ).toBeVisible();
    });
  });

  describe('empty lists', () => {
    it('opens one list at a time, showing the others as compact rows', async () => {
      setup();
      const section = card('Empty lists');

      expect(
        within(section).getByRole('textbox', { name: 'Blog index page' }),
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
        within(section).queryByRole('textbox', { name: 'Blog index page' }),
      ).not.toBeInTheDocument();
      expect(
        within(section).getByRole('button', { name: /Blog index page/ }),
      ).toHaveTextContent(SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty);
    });

    it('titles the open list once, in its header', () => {
      setup();

      expect(
        within(card('Empty lists')).getAllByText('Blog index page'),
      ).toHaveLength(1);
    });

    it('closes the open list from its header', async () => {
      setup();
      const section = card('Empty lists');

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

      expect(notFoundHeading()).toHaveValue('Nothing here');

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
        screen.getByRole('region', { name: 'Unsaved changes' }),
      ).toHaveTextContent('2 unsaved changesEnglish 1 · German 1');
    });
  });

  describe('saving', () => {
    it('leaves every untouched rich field exactly as stored, in every language', async () => {
      const saveAction = vi.fn().mockResolvedValue({ ok: true });
      setupBilingual({ saveAction });

      await user.clear(notFoundHeading());
      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(saveAction).toHaveBeenCalledWith('tenant-1', {
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
      setup({ saveAction: vi.fn().mockResolvedValue({ ok: true }) });

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Voice saved.')).toBeVisible();
      expect(refresh).toHaveBeenCalled();
    });

    it('shows an error alert and does not refresh when the save fails', async () => {
      const refresh = mockRouterRefresh();
      setup({ saveAction: vi.fn().mockResolvedValue({ ok: false }) });

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Couldn't save",
      );
      expect(refresh).not.toHaveBeenCalled();
    });

    it('shows a rejected field inline and counts it on the save bar until edited', async () => {
      setup({
        saveAction: vi.fn().mockResolvedValue({
          ok: false,
          fieldErrorsByLocale: {
            [EN]: { notFoundHeading: 'Must be 100 characters or fewer.' },
          },
        }),
      });

      await user.type(notFoundHeading(), 'Lost');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('Must be 100 characters or fewer.'),
      ).toBeVisible();
      expect(notFoundHeading()).toHaveAccessibleDescription(
        /Must be 100 characters or fewer\./,
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      const saveBar = screen.getByRole('region', { name: 'Unsaved changes' });
      expect(saveBar).toHaveTextContent('1 field needs attention');
      expect(within(saveBar).getByRole('link')).toHaveAttribute(
        'href',
        `#${notFoundHeading().id}`,
      );

      await user.type(notFoundHeading(), '!');

      expect(
        screen.queryByText('Must be 100 characters or fewer.'),
      ).not.toBeInTheDocument();
    });

    it('switches to the language and opens the list that holds a rejected field', async () => {
      setupBilingual({
        saveAction: vi.fn().mockResolvedValue({
          ok: false,
          fieldErrorsByLocale: {
            [DE]: { tagEmpty: 'Missing required placeholder {name}.' },
          },
        }),
      });

      await user.type(notFoundHeading(), '!');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('Missing required placeholder {name}.'),
      ).toBeVisible();
      expect(
        within(card('Empty lists')).getByRole('textbox', { name: 'Tag page' }),
      ).toBeVisible();
      expect(screen.getByText('German', { selector: 'strong' })).toBeVisible();
    });
  });

  it('restores the saved values on Discard', async () => {
    setupBilingual();

    await user.clear(notFoundHeading());

    expect(
      screen.getByRole('region', { name: 'Unsaved changes' }),
    ).toHaveTextContent('1 unsaved change');

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(notFoundHeading()).toHaveValue('Nothing here');
  });

  describe('archived tenant', () => {
    it('shows an archived notice and offers no Save', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expectArchivedOffersNoSave();
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
