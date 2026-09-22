import {
  expectArchivedDisablesSave,
  expectArchivedSaveDescribedByNotice,
} from '@platform/testing/assert-archived-save';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent from '@testing-library/user-event';

import { VoiceSettings } from './voice-settings';

mockRouterRefresh();

const ADVANCED_SUMMARY = 'Advanced — 8 curated strings, 2 groups';
const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');

const openAdvanced = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(ADVANCED_SUMMARY));
};

const setup = customRender(VoiceSettings, {
  tenantId: 'tenant-1',
  initialOverrides: {},
  saveAction: vi.fn(),
});

describe(`<${VoiceSettings.name}/>`, () => {
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

    expect(screen.getByTestId('disclosure')).not.toHaveAttribute('open');
    expect(screen.getByText('404 page')).not.toBeVisible();
  });

  it('shows a chevron affordance on the Advanced disclosure toggle', () => {
    setup();

    expect(
      within(screen.getByText(ADVANCED_SUMMARY)).getByTestId('icon'),
    ).toBeInTheDocument();
  });

  it('expands the Advanced section on click', async () => {
    const user = userEvent.setup();
    setup();

    await openAdvanced(user);

    expect(screen.getByTestId('disclosure')).toHaveAttribute('open');
    expect(screen.getByText('404 page')).toBeVisible();
  });

  it('renders all 8 fields across the 2 named groups, with none invented, once expanded', async () => {
    const user = userEvent.setup();
    setup();

    await openAdvanced(user);

    expect(screen.getAllByRole('textbox')).toHaveLength(8);
    expect(screen.getByText('404 page')).toBeVisible();
    expect(screen.getByText('Empty states')).toBeVisible();
    expect(screen.queryByText(/Publish confirmation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No search results/i)).not.toBeInTheDocument();
  });

  it('leaves an untouched field blank with no placeholder', async () => {
    const user = userEvent.setup();
    setup();
    await openAdvanced(user);

    const input = screen.getByRole('textbox', { name: 'Not Found Heading' });
    expect(input).toHaveValue('');
    expect(input.getAttribute('placeholder')).toBeFalsy();
  });

  it('shows an explicit stored override as the field value, not just the placeholder', async () => {
    const user = userEvent.setup();
    setup({ initialOverrides: { notFoundHeading: 'Nothing here' } });
    await openAdvanced(user);

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveValue('Nothing here');
  });

  it('saves every current field value, including a just-cleared override as an empty string', async () => {
    const user = userEvent.setup();
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
    const user = userEvent.setup();
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Saved voiceOverrides.')).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    const user = userEvent.setup();
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: false });
    setup({ saveAction });

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
    const user = userEvent.setup();
    setup({ saveAction });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();

    resolveAction({ ok: true });
  });

  describe('archived tenant', () => {
    it('shows an archived notice and disables Save', async () => {
      const user = userEvent.setup();
      const saveAction = vi.fn().mockResolvedValue({ ok: true });
      setup({ saveAction, archivedAt: ARCHIVED_AT });

      await expectArchivedDisablesSave(user, saveAction);
    });

    it('describes the disabled Save button with the archived notice text, for a screen-reader user', () => {
      setup({ archivedAt: ARCHIVED_AT });

      expectArchivedSaveDescribedByNotice();
    });

    it('makes every curated voice field read-only, not disabled', async () => {
      const user = userEvent.setup();
      setup({ archivedAt: ARCHIVED_AT });

      await openAdvanced(user);

      const fields = screen.getAllByRole('textbox');
      expect(fields).toHaveLength(8);
      for (const field of fields) {
        expect(field).toHaveAttribute('readonly');
        expect(field).toBeEnabled();
      }
    });
  });

  it('leaves every curated voice field editable for a non-archived tenant', async () => {
    const user = userEvent.setup();
    setup();

    await openAdvanced(user);

    for (const field of screen.getAllByRole('textbox')) {
      expect(field).not.toHaveAttribute('readonly');
    }
  });
});
