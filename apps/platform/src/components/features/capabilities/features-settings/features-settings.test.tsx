import { CAPABILITY } from '@blog/config';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { FeaturesSettings } from './features-settings';

mockRouterRefresh();

const ALL_ENTITLED = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
  CAPABILITY.NEWSLETTER,
  CAPABILITY.ANALYTICS,
  CAPABILITY.CONSENT_BANNER,
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
  consentBannerEnabled: false,
};

type TSaveAction = (
  tenantId: string,
  values: TSettingsFeaturesValues,
) => Promise<{ ok: boolean }>;

const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');

const setup = customRender(FeaturesSettings, {
  tenantId: 'tenant-1',
  entitledCapabilities: ALL_ENTITLED,
  initialValues: INITIAL_VALUES,
  saveAction: vi.fn(),
});

describe(`<${FeaturesSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  describe('with every capability entitled and the initial values', () => {
    beforeEach(() => {
      setup();
    });

    it('renders one toggle per built capability, reflecting the initial values', () => {
      expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
        'data-checked',
        '',
      );
      expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
        'data-unchecked',
        '',
      );
      expect(screen.getAllByRole('switch')).toHaveLength(3);
    });

    it('badges exactly the three unfinished capabilities "Coming soon"', () => {
      expect(screen.getAllByText('Coming soon')).toHaveLength(3);
    });

    it('renders the page heading and a section heading without skipping a level; toggle rows are labelled rows, not further headings', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Features' }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 2, name: 'Capabilities' }),
      ).toBeVisible();
      expect(screen.getByText('Comments')).toBeVisible();
    });

    it('toggles an entitled capability on click', async () => {
      await user.click(screen.getByRole('switch', { name: 'Bookmarks' }));

      expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
        'data-unchecked',
        '',
      );
    });

    it('offers no Save on initial render, with values unchanged', () => {
      expect(
        screen.queryByRole('button', { name: 'Save changes' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('All changes saved')).toBeVisible();
    });

    it('offers Save with the change count after toggling an entitled capability, and withdraws it once toggled back', async () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: 'Analytics',
      });

      await user.click(analyticsSwitch);
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeVisible();
      expect(
        screen.getByRole('region', { name: 'Unsaved changes' }),
      ).toHaveTextContent('1 unsaved change');

      await user.click(analyticsSwitch);
      expect(
        screen.queryByRole('button', { name: 'Save changes' }),
      ).not.toBeInTheDocument();
    });

    it('restores the saved toggles on Discard', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
        'data-unchecked',
        '',
      );
      expect(screen.getByText('All changes saved')).toBeVisible();
    });

    it('leaves entitled capability toggles enabled for a non-archived tenant', () => {
      expect(
        screen.getByRole('switch', { name: 'Bookmarks' }),
      ).not.toHaveAttribute('data-disabled');
    });
  });

  describe('on a plan that entitles only the free capabilities', () => {
    beforeEach(() => {
      setup({ entitledCapabilities: FREE_ENTITLED });
    });

    it.each(['Comments', 'Ratings', 'Newsletter'])(
      'shows %s as "Coming soon" with no toggle, whatever the plan',
      (label) => {
        expect(screen.getByText(label)).toBeVisible();
        expect(
          screen.queryByRole('switch', { name: label }),
        ).not.toBeInTheDocument();
      },
    );

    it('disables an out-of-plan toggle and shows a plan-locked badge, without hiding it', () => {
      expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
        'data-disabled',
        '',
      );
      expect(
        screen.getByRole('switch', { name: 'Cookie consent banner' }),
      ).toHaveAttribute('data-disabled', '');
      expect(
        screen.getByRole('switch', { name: 'Bookmarks' }),
      ).not.toHaveAttribute('data-disabled');
      expect(screen.getAllByText('Growth plan')).toHaveLength(2);
    });

    it('makes a locked toggle inert (unreachable and unclickable) while leaving an entitled toggle interactive, same as a provisioning-locked field', () => {
      const lockedSwitch = screen.getByRole('switch', { name: 'Analytics' });
      // eslint-disable-next-line testing-library/no-node-access
      const lockedWrapper = lockedSwitch.closest('div');
      expect(lockedWrapper?.getAttribute('inert')).toBe('');

      const entitledSwitch = screen.getByRole('switch', { name: 'Bookmarks' });
      // eslint-disable-next-line testing-library/no-node-access
      const entitledWrapper = entitledSwitch.closest('div');
      expect(entitledWrapper?.hasAttribute('inert')).toBe(false);
    });
  });

  describe('with a saveAction that succeeds', () => {
    let saveAction: Mock<TSaveAction>;

    beforeEach(() => {
      saveAction = vi.fn<TSaveAction>().mockResolvedValue({ ok: true });
      setup({ saveAction });
    });

    it('withdraws Save after a successful save, without a remount', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Save changes' }),
        ).not.toBeInTheDocument(),
      );
    });

    it('saves the current toggle state through saveAction', async () => {
      await user.click(screen.getByRole('switch', { name: 'Bookmarks' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(saveAction).toHaveBeenCalledWith('tenant-1', {
        ...INITIAL_VALUES,
        bookmarksEnabled: false,
      });
    });

    it('shows a save-confirmation toast and refreshes after a successful save', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Features saved.')).toBeVisible();
      expect(refresh).toHaveBeenCalled();
    });
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

    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();

    resolveAction({ ok: true });
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    const saveAction = vi.fn().mockResolvedValue({ ok: false });
    setup({ saveAction });

    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });

  describe('archived tenant', () => {
    let saveAction: Mock<TSaveAction>;

    beforeEach(() => {
      saveAction = vi.fn<TSaveAction>().mockResolvedValue({ ok: true });
      setup({ saveAction, archivedAt: ARCHIVED_AT });
    });

    it('shows an archived notice and offers no Save', () => {
      expectArchivedOffersNoSave();
    });

    it('disables every capability toggle, including entitled ones', async () => {
      const bookmarksSwitch = screen.getByRole('switch', { name: 'Bookmarks' });
      expect(bookmarksSwitch).toHaveAttribute('data-disabled', '');
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        /This tenant is archived/,
      );

      await user.click(bookmarksSwitch);
      expect(bookmarksSwitch).toHaveAttribute('data-checked', '');
    });
  });

  it('offers to restore unsaved toggles after leaving the page', async () => {
    const { unmount } = setup();
    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    unmount();

    setup();
    await user.click(screen.getByRole('button', { name: 'Restore 1 change' }));

    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(
      screen.getByRole('region', { name: 'Unsaved changes' }),
    ).toHaveTextContent('1 unsaved change');
  });
});
