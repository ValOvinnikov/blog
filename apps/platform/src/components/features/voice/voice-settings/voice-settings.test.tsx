import { SITE_MESSAGES_BY_LOCALE, type TVoicePortableText } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import userEvent from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

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

const setup = customRender(VoiceSettings, {
  tenantId: 'tenant-1',
  initialDraft: buildVoiceDraft({}, [EN]),
  defaultLocale: EN,
  liveLocales: [EN],
  saveAction: vi.fn(),
});

const setupBilingual = (
  overrides: Partial<Parameters<typeof VoiceSettings>[0]> = {},
) =>
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
    expect(within(section).getByText('1 customised')).toBeVisible();

    await user.click(within(section).getByRole('button', { name: 'Reset' }));

    expect(notFoundHeading()).toHaveValue('');
    expect(within(section).getByText('All default')).toBeVisible();
  });

  describe('empty lists', () => {
    it('opens one list at a time, showing the others as compact rows', async () => {
      setup();
      const section = card('Empty lists');

      expect(
        within(section).getByRole('textbox', { name: 'Blog index' }),
      ).toBeVisible();
      for (const name of [
        /Topic page/,
        /Tag page/,
        /Topics index/,
        /Tags index/,
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
        within(section).queryByRole('textbox', { name: 'Blog index' }),
      ).not.toBeInTheDocument();
      expect(
        within(section).getByRole('button', { name: /Blog index/ }),
      ).toHaveTextContent(SITE_MESSAGES_BY_LOCALE.EN.blogListPage.empty);
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

    it('lists each live language with its customised count', () => {
      setupBilingual();

      const switcher = screen.getByRole('group', { name: 'Language' });
      expect(
        within(switcher).getByRole('button', {
          name: 'English · 3 customised',
        }),
      ).toBeVisible();
      expect(
        within(switcher).getByRole('button', { name: 'German · 1 customised' }),
      ).toBeVisible();
    });

    it("edits the selected language's values against that language's defaults", async () => {
      setupBilingual();

      expect(notFoundHeading()).toHaveValue('Nothing here');

      await user.click(
        screen.getByRole('button', { name: 'German · 1 customised' }),
      );

      expect(notFoundHeading()).toHaveValue('');
      expect(notFoundHeading()).toHaveAttribute(
        'placeholder',
        SITE_MESSAGES_BY_LOCALE.DE.notFound.heading,
      );
      expect(screen.getByText(/Editing German/)).toBeVisible();
    });

    it('breaks the unsaved count down by language', async () => {
      setupBilingual();

      await user.type(notFoundHeading(), '!');
      await user.click(
        screen.getByRole('button', { name: 'German · 1 customised' }),
      );
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
      expect(
        screen.getByRole('region', { name: 'Unsaved changes' }),
      ).toHaveTextContent('1 field needs attention');

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
      expect(screen.getByText(/Editing German/)).toBeVisible();
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
