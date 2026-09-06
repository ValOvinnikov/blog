import { CAPABILITY } from '@blog/config';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { FeaturesSettings } from './features-settings';

const render = renderWithIntl;

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
} as unknown as ReturnType<typeof useRouter>);

const ALL_ENTITLED = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
  CAPABILITY.NEWSLETTER,
  CAPABILITY.ANALYTICS,
];

const FREE_ENTITLED = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
];

const INITIAL_VALUES: TSettingsFeaturesValues = {
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: false,
  analyticsEnabled: false,
};

describe(FeaturesSettings, () => {
  it('renders one toggle per v1 capability, reflecting the initial values', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
    expect(screen.getAllByRole('switch')).toHaveLength(5);
  });

  it('disables an out-of-plan toggle and shows a plan-locked badge, without hiding it', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={FREE_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(
      screen.getByRole('switch', { name: 'Comments' }),
    ).not.toHaveAttribute('data-disabled');
    expect(screen.getAllByText('Growth plan')).toHaveLength(2);
  });

  it('makes a locked toggle inert (unreachable and unclickable) while leaving an entitled toggle interactive, same as a provisioning-locked field', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={FREE_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    const lockedSwitch = screen.getByRole('switch', { name: 'Newsletter' });
    const lockedWrapper = lockedSwitch.closest('div');
    expect(lockedWrapper?.getAttribute('inert')).toBe('');

    const entitledSwitch = screen.getByRole('switch', { name: 'Comments' });
    const entitledWrapper = entitledSwitch.closest('div');
    expect(entitledWrapper?.hasAttribute('inert')).toBe(false);
  });

  it('renders the page heading and a section heading without skipping a level; toggle rows are labelled rows, not further headings', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Features' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Capabilities' }),
    ).toBeVisible();
    expect(screen.getByText('Comments')).toBeVisible();
  });

  it('toggles an entitled capability on click', async () => {
    const user = userEvent.setup();
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Comments' }));

    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });

  it('saves the current toggle state through saveAction', async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Ratings' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveAction).toHaveBeenCalledWith('tenant-1', {
      ...INITIAL_VALUES,
      ratingsEnabled: false,
    });
  });

  it('shows a save-confirmation toast and refreshes after a successful save', async () => {
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
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Features saved.')).toBeVisible();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows a spinner, marks Save busy, and announces the pending state to assistive tech while the save is in flight', async () => {
    let resolveAction: (value: { ok: boolean }) => void = () => {};
    const saveAction = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const saveButton = await screen.findByRole('button', {
      name: 'Saving…',
    });
    await waitFor(() =>
      expect(saveButton).toHaveAttribute('aria-busy', 'true'),
    );
    expect(saveButton).toBeDisabled();
    // A disabled button is force-blurred; this live region carries the real announcement.
    expect(saveButton.nextElementSibling).toHaveTextContent('Saving…');

    resolveAction({ ok: true });
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
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });

  it('shows an archived notice and disables Save for an archived tenant', async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(screen.getByText('This tenant is archived')).toBeVisible();

    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);
    expect(saveAction).not.toHaveBeenCalled();
  });

  it('describes the disabled Save button with the archived notice text, for a screen-reader user', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toHaveAccessibleDescription(/This tenant is archived/);
  });

  it('disables every capability toggle, including entitled ones, for an archived tenant', async () => {
    const user = userEvent.setup();
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    const commentsSwitch = screen.getByRole('switch', { name: 'Comments' });
    expect(commentsSwitch).toHaveAttribute('data-disabled', '');
    expect(commentsSwitch).toHaveAccessibleDescription(
      /This tenant is archived/,
    );

    await user.click(commentsSwitch);
    expect(commentsSwitch).toHaveAttribute('data-checked', '');
  });

  it('leaves entitled capability toggles enabled for a non-archived tenant', () => {
    render(
      <FeaturesSettings
        tenantId="tenant-1"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('switch', { name: 'Comments' }),
    ).not.toHaveAttribute('data-disabled');
  });
});
