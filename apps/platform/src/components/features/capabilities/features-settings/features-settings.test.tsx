import { CAPABILITY } from '@blog/config';
import {
  expectArchivedDisablesSave,
  expectArchivedSaveDescribedByNotice,
} from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import userEvent from '@testing-library/user-event';

import { FeaturesSettings } from './features-settings';

mockRouterRefresh();

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

const ARCHIVED_AT = new Date('2026-08-26T00:00:00.000Z');

const setup = customRender(FeaturesSettings, {
  tenantId: 'tenant-1',
  entitledCapabilities: ALL_ENTITLED,
  initialValues: INITIAL_VALUES,
  saveAction: vi.fn(),
});

describe(`<${FeaturesSettings.name}/>`, () => {
  it('renders one toggle per v1 capability, reflecting the initial values', () => {
    setup();

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
    setup({ entitledCapabilities: FREE_ENTITLED });

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
    setup({ entitledCapabilities: FREE_ENTITLED });

    const lockedSwitch = screen.getByRole('switch', { name: 'Newsletter' });
    // eslint-disable-next-line testing-library/no-node-access
    const lockedWrapper = lockedSwitch.closest('div');
    expect(lockedWrapper?.getAttribute('inert')).toBe('');

    const entitledSwitch = screen.getByRole('switch', { name: 'Comments' });
    // eslint-disable-next-line testing-library/no-node-access
    const entitledWrapper = entitledSwitch.closest('div');
    expect(entitledWrapper?.hasAttribute('inert')).toBe(false);
  });

  it('renders the page heading and a section heading without skipping a level; toggle rows are labelled rows, not further headings', () => {
    setup();

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
    setup();

    await user.click(screen.getByRole('switch', { name: 'Comments' }));

    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });

  it('disables Save on initial render, with values unchanged', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('enables Save after toggling an entitled capability, and disables it again once toggled back', async () => {
    const user = userEvent.setup();
    setup();

    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    const newsletterSwitch = screen.getByRole('switch', {
      name: 'Newsletter',
    });

    await user.click(newsletterSwitch);
    expect(saveButton).toBeEnabled();

    await user.click(newsletterSwitch);
    expect(saveButton).toBeDisabled();
  });

  it('disables Save again after a successful save, without a remount', async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    await user.click(screen.getByRole('switch', { name: 'Newsletter' }));
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() => expect(saveButton).toBeDisabled());
  });

  it('saves the current toggle state through saveAction', async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    await user.click(screen.getByRole('switch', { name: 'Ratings' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveAction).toHaveBeenCalledWith('tenant-1', {
      ...INITIAL_VALUES,
      ratingsEnabled: false,
    });
  });

  it('shows a save-confirmation toast and refreshes after a successful save', async () => {
    const user = userEvent.setup();
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    await user.click(screen.getByRole('switch', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Features saved.')).toBeVisible();
    expect(refresh).toHaveBeenCalled();
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

    await user.click(screen.getByRole('switch', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();

    resolveAction({ ok: true });
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    const user = userEvent.setup();
    const refresh = mockRouterRefresh();
    const saveAction = vi.fn().mockResolvedValue({ ok: false });
    setup({ saveAction });

    await user.click(screen.getByRole('switch', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
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

    it('disables every capability toggle, including entitled ones', async () => {
      const user = userEvent.setup();
      setup({ archivedAt: ARCHIVED_AT });

      const commentsSwitch = screen.getByRole('switch', { name: 'Comments' });
      expect(commentsSwitch).toHaveAttribute('data-disabled', '');
      expect(commentsSwitch).toHaveAccessibleDescription(
        /This tenant is archived/,
      );

      await user.click(commentsSwitch);
      expect(commentsSwitch).toHaveAttribute('data-checked', '');
    });
  });

  it('leaves entitled capability toggles enabled for a non-archived tenant', () => {
    setup();

    expect(
      screen.getByRole('switch', { name: 'Comments' }),
    ).not.toHaveAttribute('data-disabled');
  });
});
