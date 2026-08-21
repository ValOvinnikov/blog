import { renderWithIntl, screen } from '@admin/testing/custom-render';
import type { TSettingsFeaturesValues } from '@admin/utils/settings-features-fields/settings-features-fields';
import { CAPABILITY } from '@blog/config';
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
        tenantSlug="acme"
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
        tenantSlug="acme"
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

  it('toggles an entitled capability on click', async () => {
    const user = userEvent.setup();
    render(
      <FeaturesSettings
        tenantSlug="acme"
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
        tenantSlug="acme"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Ratings' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveAction).toHaveBeenCalledWith('acme', {
      ...INITIAL_VALUES,
      ratingsEnabled: false,
    });
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
      <FeaturesSettings
        tenantSlug="acme"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Features saved.')).toBeVisible();
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
      <FeaturesSettings
        tenantSlug="acme"
        entitledCapabilities={ALL_ENTITLED}
        initialValues={INITIAL_VALUES}
        saveAction={saveAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });
});
