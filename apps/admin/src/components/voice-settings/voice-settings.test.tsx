import {
  CONSOLE_VOICE_PACK,
  EDITORIAL_VOICE_PACK,
} from '@blog/config/constants';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { VoiceSettings } from './voice-settings';

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
} as unknown as ReturnType<typeof useRouter>);

const ADVANCED_SUMMARY = 'Advanced — 20 curated strings, 4 groups';

// Advanced starts collapsed (matching the Look tab) — every test that reads
// or interacts with a curated field opens it first, same as a real user
// would have to.
async function openAdvanced(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(ADVANCED_SUMMARY));
}

describe(VoiceSettings, () => {
  it('renders Basic empty, with a stated reason', () => {
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Basic' })).toBeVisible();
    expect(screen.getByText(/Nothing required here\./)).toBeVisible();
    // Basic explains itself; it renders no input fields of its own.
    expect(
      within(
        screen.getByRole('heading', { name: 'Basic' }).parentElement!,
      ).queryAllByRole('textbox'),
    ).toHaveLength(0);
  });

  it('starts the Advanced section collapsed', () => {
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={vi.fn()}
      />,
    );

    expect(
      screen.getByText(ADVANCED_SUMMARY).closest('details'),
    ).not.toHaveAttribute('open');
    expect(screen.getByText('404 page')).not.toBeVisible();
  });

  it('renders all 20 fields across the 4 named groups, with none invented, once expanded', async () => {
    const user = userEvent.setup();
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={vi.fn()}
      />,
    );

    await openAdvanced(user);

    expect(screen.getAllByRole('textbox')).toHaveLength(20);
    expect(screen.getByText('404 page')).toBeVisible();
    expect(screen.getByText('Terminal prompts')).toBeVisible();
    expect(screen.getByText('Bookmarks')).toBeVisible();
    expect(screen.getByText('Empty states')).toBeVisible();
    expect(screen.queryByText(/Publish confirmation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No search results/i)).not.toBeInTheDocument();
  });

  it("shows the console preset's voice-pack value as the placeholder for an untouched field", async () => {
    const user = userEvent.setup();
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={vi.fn()}
      />,
    );
    await openAdvanced(user);

    const input = screen.getByRole('textbox', { name: 'Terminal Prompt Host' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', '~$');
  });

  it('leaves the placeholder blank for a field with no path in the editorial voice pack', async () => {
    const user = userEvent.setup();
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={EDITORIAL_VOICE_PACK}
        initialOverrides={{}}
        saveAction={vi.fn()}
      />,
    );
    await openAdvanced(user);

    const input = screen.getByRole('textbox', { name: 'Terminal Prompt Host' });
    expect(input.getAttribute('placeholder')).toBeFalsy();
  });

  it('shows an explicit stored override as the field value, not just the placeholder', async () => {
    const user = userEvent.setup();
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{ terminalPromptHost: 'guest@acme' }}
        saveAction={vi.fn()}
      />,
    );
    await openAdvanced(user);

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('guest@acme');
  });

  it('saves every current field value, including a just-cleared override as an empty string', async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{ terminalPromptHost: 'guest@acme' }}
        saveAction={saveAction}
      />,
    );
    await openAdvanced(user);

    await user.clear(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Bookmark Toast — Saved' }),
      'saved!',
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveAction).toHaveBeenCalledWith(
      'acme',
      expect.objectContaining({
        terminalPromptHost: '',
        bookmarkToastSavedMessage: 'saved!',
        notFoundDescription: '',
      }),
    );
  });

  it('shows a success alert and refreshes after a successful save', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Saved voiceOverrides.')).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
    const saveAction = vi.fn().mockResolvedValue({ ok: false });
    render(
      <VoiceSettings
        tenantSlug="acme"
        voicePack={CONSOLE_VOICE_PACK}
        initialOverrides={{}}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });
});
