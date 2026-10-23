import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_ARCHIVED_AT,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FeaturesSettings } from './features-settings';

vi.mock('@platform/server/settings-features/update-features-action', () => ({
  updateFeaturesAction: vi.fn(),
}));

const updateFeaturesActionMock = vi.mocked(updateFeaturesAction);

mockRouterRefresh();

const ALL_ENTITLED = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
  CAPABILITY.NEWSLETTER,
  CAPABILITY.ANALYTICS,
  CAPABILITY.CONSENT_BANNER,
  CAPABILITY.CONTACT_FORM,
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
  contactFormEnabled: true,
};

const setup = customRender(FeaturesSettings, {
  tenantId: TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  initialValues: INITIAL_VALUES,
});

const DATA_CHECKED = 'data-checked';
const DATA_UNCHECKED = 'data-unchecked';
const CONTACT_FORM_LABEL = 'Contact form';
const SAVE_CHANGES = 'Save changes';
const ALL_CHANGES_SAVED = 'All changes saved';
const UNSAVED_CHANGES = 'Unsaved changes';
const ONE_UNSAVED_CHANGE = '1 unsaved change';
const DATA_DISABLED = 'data-disabled';

describe(`<${FeaturesSettings.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    updateFeaturesActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  describe('with every capability entitled and the initial values', () => {
    beforeEach(() => {
      setup();
    });

    it('renders one toggle per built capability, reflecting the initial values', () => {
      expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
        DATA_CHECKED,
        '',
      );
      expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
        DATA_UNCHECKED,
        '',
      );
      expect(
        screen.getByRole('switch', { name: CONTACT_FORM_LABEL }),
      ).toHaveAttribute(DATA_CHECKED, '');
      expect(screen.getAllByRole('switch')).toHaveLength(4);
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
        DATA_UNCHECKED,
        '',
      );
    });

    it('offers no Save on initial render, with values unchanged', () => {
      expect(
        screen.queryByRole('button', { name: SAVE_CHANGES }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
    });

    it('offers Save with the change count after toggling an entitled capability, and withdraws it once toggled back', async () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: 'Analytics',
      });

      await user.click(analyticsSwitch);
      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeVisible();
      expect(
        screen.getByRole('region', { name: UNSAVED_CHANGES }),
      ).toHaveTextContent(ONE_UNSAVED_CHANGE);

      await user.click(analyticsSwitch);
      expect(
        screen.queryByRole('button', { name: SAVE_CHANGES }),
      ).not.toBeInTheDocument();
    });

    it('restores the saved toggles on Discard', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
        DATA_UNCHECKED,
        '',
      );
      expect(screen.queryByText(ALL_CHANGES_SAVED)).not.toBeInTheDocument();
    });

    it('leaves entitled capability toggles enabled for a non-archived tenant', () => {
      expect(
        screen.getByRole('switch', { name: 'Bookmarks' }),
      ).not.toHaveAttribute(DATA_DISABLED);
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
        DATA_DISABLED,
        '',
      );
      expect(
        screen.getByRole('switch', { name: 'Cookie consent banner' }),
      ).toHaveAttribute(DATA_DISABLED, '');
      expect(
        screen.getByRole('switch', { name: CONTACT_FORM_LABEL }),
      ).toHaveAttribute(DATA_DISABLED, '');
      expect(
        screen.getByRole('switch', { name: 'Bookmarks' }),
      ).not.toHaveAttribute(DATA_DISABLED);
      expect(screen.getAllByText('Growth plan')).toHaveLength(3);
    });

    it('describes a locked toggle by its description and plan lock, and an entitled one by its description alone', () => {
      expect(
        screen.getByRole('switch', { name: 'Analytics' }),
      ).toHaveAccessibleDescription(
        'Enable on-site analytics tracking. Growth plan',
      );
      expect(
        screen.getByRole('switch', { name: 'Bookmarks' }),
      ).toHaveAccessibleDescription('Let readers save posts to read later.');
    });
  });

  describe('with a save that succeeds', () => {
    beforeEach(() => {
      setup();
    });

    it('withdraws Save after a successful save, without a remount', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: SAVE_CHANGES }),
        ).not.toBeInTheDocument(),
      );
    });

    it('saves the current toggle state', async () => {
      await user.click(screen.getByRole('switch', { name: 'Bookmarks' }));
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(updateFeaturesActionMock).toHaveBeenCalledWith(TENANT_ID, {
        ...INITIAL_VALUES,
        bookmarksEnabled: false,
      });
    });

    it('shows a save-confirmation toast and refreshes after a successful save', async () => {
      await user.click(screen.getByRole('switch', { name: 'Analytics' }));
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(await screen.findByText('Features saved.')).toBeVisible();
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows the saving state while the save is in flight', async () => {
    let resolveAction: (value: TUpdateFeaturesResult) => void = () => {};
    updateFeaturesActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    setup();

    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    expect(
      await screen.findByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    updateFeaturesActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
    expect(refresh).not.toHaveBeenCalled();
  });

  describe('archived tenant', () => {
    beforeEach(() => {
      setup({ archivedAt: MOCK_ARCHIVED_AT });
    });

    it('shows an archived notice and offers no Save', () => {
      expectArchivedOffersNoSave();
    });

    it('disables every capability toggle, including entitled ones', async () => {
      const bookmarksSwitch = screen.getByRole('switch', { name: 'Bookmarks' });
      expect(bookmarksSwitch).toHaveAttribute(DATA_DISABLED, '');
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        /This tenant is archived/,
      );

      await user.click(bookmarksSwitch);
      expect(bookmarksSwitch).toHaveAttribute(DATA_CHECKED, '');
    });
  });

  it('offers to restore unsaved toggles after leaving the page', async () => {
    const { unmount } = setup();
    await user.click(screen.getByRole('switch', { name: 'Analytics' }));
    unmount();

    setup();
    await user.click(screen.getByRole('button', { name: 'Restore 1 change' }));

    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      DATA_CHECKED,
      '',
    );
    expect(
      screen.getByRole('region', { name: UNSAVED_CHANGES }),
    ).toHaveTextContent(ONE_UNSAVED_CHANGE);
  });
});
