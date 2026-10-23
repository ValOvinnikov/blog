import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_DESCRIPTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
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
  tenantId: MOCK_TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  initialValues: INITIAL_VALUES,
});

const DATA_CHECKED = 'data-checked';
const DATA_UNCHECKED = 'data-unchecked';
const CONTACT_FORM_LABEL = 'Contact form';
const BOOKMARKS_LABEL = 'Bookmarks';
const ANALYTICS_LABEL = 'Analytics';
const ONE_UNSAVED_CHANGE = '1 unsaved change';
const DATA_DISABLED = 'data-disabled';
const BOOKMARKS_DESCRIPTION = 'Let readers save posts to read later.';
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
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
      const switches = screen.getAllByRole('switch');

      expect(bookmarksSwitch).toHaveAttribute(DATA_CHECKED, '');
      expect(analyticsSwitch).toHaveAttribute(DATA_UNCHECKED, '');
      expect(contactFormSwitch).toHaveAttribute(DATA_CHECKED, '');
      expect(switches).toHaveLength(4);
    });

    it('badges exactly the three unfinished capabilities "Coming soon"', () => {
      const badges = screen.getAllByText('Coming soon');

      expect(badges).toHaveLength(3);
    });

    it('renders the page heading and a section heading without skipping a level; toggle rows are labelled rows, not further headings', () => {
      const pageHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Features',
      });
      const sectionHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Capabilities',
      });
      const commentsRow = screen.getByText('Comments');

      expect(pageHeading).toBeVisible();
      expect(sectionHeading).toBeVisible();
      expect(commentsRow).toBeVisible();
    });

    it('toggles an entitled capability on click', async () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      await user.click(bookmarksSwitch);

      const toggledSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(toggledSwitch).toHaveAttribute(DATA_UNCHECKED, '');
    });

    it('offers no Save on initial render, with values unchanged', () => {
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
      const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

      expect(saveButton).not.toBeInTheDocument();
      expect(allSaved).not.toBeInTheDocument();
    });

    it('offers Save with the change count after toggling an entitled capability, and withdraws it once toggled back', async () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });

      await user.click(analyticsSwitch);

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      const unsavedRegion = screen.getByRole('region', {
        name: UNSAVED_CHANGES,
      });

      expect(saveButton).toBeVisible();
      expect(unsavedRegion).toHaveTextContent(ONE_UNSAVED_CHANGE);

      await user.click(analyticsSwitch);

      const withdrawnSaveButton = screen.queryByRole('button', {
        name: SAVE_CHANGES,
      });

      expect(withdrawnSaveButton).not.toBeInTheDocument();
    });

    it('restores the saved toggles on Discard', async () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });

      await user.click(analyticsSwitch);

      const discardButton = screen.getByRole('button', { name: 'Discard' });

      await user.click(discardButton);

      const restoredSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

      expect(restoredSwitch).toHaveAttribute(DATA_UNCHECKED, '');
      expect(allSaved).not.toBeInTheDocument();
    });

    it('leaves entitled capability toggles enabled for a non-archived tenant', () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(bookmarksSwitch).not.toHaveAttribute(DATA_DISABLED);
    });
  });

  describe('on a plan that entitles only the free capabilities', () => {
    beforeEach(() => {
      setup({ entitledCapabilities: FREE_ENTITLED });
    });

    it.each(['Comments', 'Ratings', 'Newsletter'])(
      'shows %s as "Coming soon" with no toggle, whatever the plan',
      (label) => {
        const row = screen.getByText(label);
        const toggle = screen.queryByRole('switch', { name: label });

        expect(row).toBeVisible();
        expect(toggle).not.toBeInTheDocument();
      },
    );

    it('disables an out-of-plan toggle and shows a plan-locked badge, without hiding it', () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const consentSwitch = screen.getByRole('switch', {
        name: 'Cookie consent banner',
      });
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });
      const planBadges = screen.getAllByText('Growth plan');

      expect(analyticsSwitch).toHaveAttribute(DATA_DISABLED, '');
      expect(consentSwitch).toHaveAttribute(DATA_DISABLED, '');
      expect(contactFormSwitch).toHaveAttribute(DATA_DISABLED, '');
      expect(bookmarksSwitch).not.toHaveAttribute(DATA_DISABLED);
      expect(planBadges).toHaveLength(3);
    });

    it('describes a locked toggle by its description and plan lock, and an entitled one by its description alone', () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(analyticsSwitch).toHaveAccessibleDescription(
        'Enable on-site analytics tracking. Growth plan',
      );
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        BOOKMARKS_DESCRIPTION,
      );
    });
  });

  describe('with a save that succeeds', () => {
    beforeEach(() => {
      setup();
    });

    it('saves the current toggle state', async () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      await user.click(bookmarksSwitch);

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

      await user.click(saveButton);

      expect(updateFeaturesActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        ...INITIAL_VALUES,
        bookmarksEnabled: false,
      });
    });

    describe('after toggling Analytics and saving', () => {
      beforeEach(async () => {
        const analyticsSwitch = screen.getByRole('switch', {
          name: ANALYTICS_LABEL,
        });

        await user.click(analyticsSwitch);

        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

        await user.click(saveButton);
      });

      it('withdraws Save after a successful save, without a remount', async () => {
        await waitFor(() => {
          const saveButton = screen.queryByRole('button', {
            name: SAVE_CHANGES,
          });

          expect(saveButton).not.toBeInTheDocument();
        });
      });

      it('shows a save-confirmation toast and refreshes after a successful save', async () => {
        const toast = await screen.findByText('Features saved.');

        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalled();
      });
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

    const analyticsSwitch = screen.getByRole('switch', {
      name: ANALYTICS_LABEL,
    });

    await user.click(analyticsSwitch);

    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

    await user.click(saveButton);

    const savingButton = await screen.findByRole('button', { name: 'Saving…' });

    expect(savingButton).toBeDisabled();

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    updateFeaturesActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    const analyticsSwitch = screen.getByRole('switch', {
      name: ANALYTICS_LABEL,
    });

    await user.click(analyticsSwitch);

    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

    await user.click(saveButton);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent("Couldn't save");
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
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(bookmarksSwitch).toHaveAttribute(DATA_DISABLED, '');
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${BOOKMARKS_DESCRIPTION}`,
      );

      await user.click(bookmarksSwitch);

      expect(bookmarksSwitch).toHaveAttribute(DATA_CHECKED, '');
    });
  });

  it('offers to restore unsaved toggles after leaving the page', async () => {
    const { unmount } = setup();
    const analyticsSwitch = screen.getByRole('switch', {
      name: ANALYTICS_LABEL,
    });

    await user.click(analyticsSwitch);
    unmount();

    setup();

    const restoreButton = screen.getByRole('button', {
      name: 'Restore 1 change',
    });

    await user.click(restoreButton);

    const restoredSwitch = screen.getByRole('switch', {
      name: ANALYTICS_LABEL,
    });
    const unsavedRegion = screen.getByRole('region', { name: UNSAVED_CHANGES });

    expect(restoredSwitch).toHaveAttribute(DATA_CHECKED, '');
    expect(unsavedRegion).toHaveTextContent(ONE_UNSAVED_CHANGE);
  });
});
