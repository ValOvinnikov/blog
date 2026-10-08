import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

mockRouterRefresh();

const ADVANCED_SUMMARY = 'Advanced — 7 curated strings, 2 groups';
const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');

const openAdvanced = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(ADVANCED_SUMMARY));
};

const editOneField = async (user: ReturnType<typeof userEvent.setup>) => {
  await openAdvanced(user);
  await user.type(
    screen.getByRole('textbox', { name: 'Blog List Empty' }),
    'edited',
  );
};

const setup = customRender(VoiceSettings, {
  tenantId: 'tenant-1',
  initialOverrides: {},
  saveAction: vi.fn(),
});

describe(`<${VoiceSettings.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders Basic empty, with a stated reason', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Basic' })).toBeVisible();
    expect(screen.getByText(/Nothing required here\./)).toBeVisible();
    expect(
      within(screen.getByTestId('voice-basic-card')).queryAllByRole('textbox'),
    ).toHaveLength(0);
  });

  it('starts the Advanced section collapsed', () => {
    setup();

    expect(screen.getByRole('group')).not.toHaveAttribute('open');
    expect(screen.getByText('404 page')).not.toBeVisible();
  });

  it('shows a chevron affordance on the Advanced disclosure toggle', () => {
    setup();

    expect(
      within(screen.getByText(ADVANCED_SUMMARY)).getByTestId('icon'),
    ).toBeVisible();
  });

  it('expands the Advanced section on click', async () => {
    setup();

    await openAdvanced(user);

    expect(screen.getByRole('group')).toHaveAttribute('open');
    expect(screen.getByText('404 page')).toBeVisible();
  });

  it('renders all 7 fields across the 2 named groups, with none invented, once expanded', async () => {
    setup();

    await openAdvanced(user);

    expect(screen.getAllByRole('textbox')).toHaveLength(7);
    expect(screen.getByText('404 page')).toBeVisible();
    expect(screen.getByText('Empty states')).toBeVisible();
    expect(screen.queryByText(/Publish confirmation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No search results/i)).not.toBeInTheDocument();
  });

  it('leaves an untouched field blank with no placeholder', async () => {
    setup();
    await openAdvanced(user);

    const input = screen.getByRole('textbox', { name: 'Not Found Heading' });
    expect(input).toHaveValue('');
    expect(input.getAttribute('placeholder')).toBeFalsy();
  });

  it('shows an explicit stored override as the field value, not just the placeholder', async () => {
    setup({ initialOverrides: { notFoundHeading: 'Nothing here' } });
    await openAdvanced(user);

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveValue('Nothing here');
  });

  it('saves every current field value, including a just-cleared override as an empty string', async () => {
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({
      initialOverrides: { notFoundHeading: 'Nothing here' },
      saveAction,
    });
    await openAdvanced(user);

    await user.clear(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Blog List Empty' }),
      'saved!',
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveAction).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        notFoundHeading: '',
        blogListEmpty: 'saved!',
        notFoundSupportingText: '',
      }),
    );
  });

  it('shows a save-confirmation toast and refreshes after a successful save', async () => {
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    await editOneField(user);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Saved voiceOverrides.')).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: false });
    setup({ saveAction });

    await editOneField(user);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });

  it('shows the saving state while the save is in flight', async () => {
    let resolveAction: (value: { ok: boolean }) => void = () => {};
    const saveAction = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    setup({ saveAction });

    await editOneField(user);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();

    resolveAction({ ok: true });
  });

  describe('archived tenant', () => {
    it('shows an archived notice and offers no Save', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expectArchivedOffersNoSave();
    });

    it('makes every curated voice field read-only, not disabled', async () => {
      setup({ archivedAt: ARCHIVED_AT });

      await openAdvanced(user);

      const fields = screen.getAllByRole('textbox');
      expect(fields).toHaveLength(7);
      for (const field of fields) {
        expect(field).toHaveAttribute('readonly');
        expect(field).toBeEnabled();
      }
    });
  });

  it('counts the edited fields and restores them on Discard', async () => {
    setup({ initialOverrides: { notFoundHeading: 'Nothing here' } });
    await editOneField(user);
    await user.clear(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    );

    expect(
      screen.getByRole('region', { name: 'Unsaved changes' }),
    ).toHaveTextContent('2 unsaved changes');

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveValue('Nothing here');
    expect(
      screen.getByRole('textbox', { name: 'Blog List Empty' }),
    ).toHaveValue('');
  });

  it('leaves every curated voice field editable for a non-archived tenant', async () => {
    setup();

    await openAdvanced(user);

    for (const field of screen.getAllByRole('textbox')) {
      expect(field).not.toHaveAttribute('readonly');
    }
  });
});
