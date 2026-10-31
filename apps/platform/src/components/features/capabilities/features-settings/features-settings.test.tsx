import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_DESCRIPTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FeaturesSettings } from './features-settings';

vi.mock('@platform/server/settings-features/update-features-action', () => ({
  updateFeaturesAction: vi.fn(),
}));

const updateFeaturesActionMock = vi.mocked(updateFeaturesAction);

const ALL_ENTITLED = Object.values(CAPABILITY);
const PARTIAL_ENTITLEMENT = [
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
];

const INITIAL_VALUES = mockSettingsFeaturesValues({
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  contactFormEnabled: true,
});

const {
  heading,
  capabilitiesHeading,
  comingSoonBadge,
  planLockedBadge,
  alertSuccess,
  alertError,
  readerAccountNote,
  toggleLabel,
  toggleDescription,
} = messages.featuresSettings;

const BOOKMARKS_LABEL = toggleLabel[CAPABILITY.BOOKMARKS];
const ANALYTICS_LABEL = toggleLabel[CAPABILITY.ANALYTICS];
const CONTACT_FORM_LABEL = toggleLabel[CAPABILITY.CONTACT_FORM];
const { saveBar } = messages;
const ONE_UNSAVED_CHANGE = makeEnTranslator('saveBar')('unsavedChanges', {
  count: 1,
});
const RESTORE_ONE_CHANGE = makeEnTranslator('draftRecovery')('restore', {
  count: 1,
});

const setup = customRender(FeaturesSettings, {
  tenantId: MOCK_TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  initialValues: INITIAL_VALUES,
});

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

  describe('with every capability entitled', () => {
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

      expect(bookmarksSwitch).toBeChecked();
      expect(analyticsSwitch).not.toBeChecked();
      expect(contactFormSwitch).toBeChecked();
      expect(switches).toHaveLength(4);
    });

    it('badges exactly the three unfinished capabilities "Coming soon"', () => {
      const badges = screen.getAllByText(comingSoonBadge);

      expect(badges).toHaveLength(3);
    });

    it('nests the Capabilities heading directly under the page heading', () => {
      const pageHeading = screen.getByRole('heading', {
        level: 1,
        name: heading,
      });
      const sectionHeading = screen.getByRole('heading', {
        level: 2,
        name: capabilitiesHeading,
      });

      expect(pageHeading).toBeVisible();
      expect(sectionHeading).toBeVisible();
    });

    it('toggles an entitled capability on click', async () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      await user.click(bookmarksSwitch);

      expect(bookmarksSwitch).not.toBeChecked();
    });

    it('offers no Save while the values are unchanged', () => {
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
      const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

      expect(saveButton).not.toBeInTheDocument();
      expect(allSaved).not.toBeInTheDocument();
    });

    it('counts an unsaved toggle and withdraws Save once it is toggled back', async () => {
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

      const discardButton = screen.getByRole('button', {
        name: saveBar.discard,
      });

      await user.click(discardButton);

      const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

      expect(analyticsSwitch).not.toBeChecked();
      expect(allSaved).not.toBeInTheDocument();
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
        const toast = await screen.findByText(alertSuccess);

        expect(toast).toBeVisible();
        expect(refresh).toHaveBeenCalled();
      });
    });
  });

  describe('with only some capabilities entitled', () => {
    beforeEach(() => {
      setup({ entitledCapabilities: PARTIAL_ENTITLEMENT });
    });

    it.each([
      toggleLabel[CAPABILITY.COMMENTS],
      toggleLabel[CAPABILITY.RATINGS],
      toggleLabel[CAPABILITY.NEWSLETTER],
    ])(
      'shows %s as "Coming soon" with no toggle, whatever the plan',
      (label) => {
        const row = screen.getByText(label);
        const toggle = screen.queryByRole('switch', { name: label });

        expect(row).toBeVisible();
        expect(toggle).not.toBeInTheDocument();
      },
    );

    it('shows an out-of-plan toggle disabled and badged, never hidden', () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const consentSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.CONSENT_BANNER],
      });
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });
      const planBadges = screen.getAllByText(planLockedBadge);

      expect(analyticsSwitch).toBeDisabled();
      expect(consentSwitch).toBeDisabled();
      expect(contactFormSwitch).toBeDisabled();
      expect(bookmarksSwitch).toBeEnabled();
      expect(planBadges).toHaveLength(3);
    });

    it('adds the plan lock to the description of a locked toggle only', () => {
      const analyticsSwitch = screen.getByRole('switch', {
        name: ANALYTICS_LABEL,
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(analyticsSwitch).toHaveAccessibleDescription(
        `${toggleDescription[CAPABILITY.ANALYTICS]} ${planLockedBadge}`,
      );
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        toggleDescription[CAPABILITY.BOOKMARKS],
      );
    });
  });

  it('shows the saving state while the save is in flight', async () => {
    let resolveAction: (value: TUpdateFeaturesResult) => void = () => {};
    updateFeaturesActionMock.mockImplementationOnce(
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

    const savingButton = await screen.findByRole('button', {
      name: saveBar.saving,
    });

    expect(savingButton).toHaveAttribute('aria-disabled', 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

    const allSaved = await screen.findByText(ALL_CHANGES_SAVED);

    expect(allSaved).toBeVisible();
  });

  it('shows an error alert and does not refresh when the save fails', async () => {
    updateFeaturesActionMock.mockResolvedValueOnce({
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

    expect(alert).toHaveTextContent(alertError);
    expect(refresh).not.toHaveBeenCalled();
  });

  describe('with every reader feature off', () => {
    beforeEach(() => {
      setup({ initialValues: mockSettingsFeaturesValues() });
    });

    it('tells the owner signed-in readers keep their account page', () => {
      const note = screen.getByText(readerAccountNote);

      expect(note).toBeVisible();
    });

    it('withdraws the note once Bookmarks is switched on', async () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      await user.click(bookmarksSwitch);

      const note = screen.queryByText(readerAccountNote);

      expect(note).not.toBeInTheDocument();
    });
  });

  it('shows no reader-account note while a reader feature is on', () => {
    setup();

    const note = screen.queryByText(readerAccountNote);

    expect(note).not.toBeInTheDocument();
  });

  describe('for an archived tenant', () => {
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

      expect(bookmarksSwitch).toBeDisabled();
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${toggleDescription[CAPABILITY.BOOKMARKS]}`,
      );

      await user.click(bookmarksSwitch);

      expect(bookmarksSwitch).toBeChecked();
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
      name: RESTORE_ONE_CHANGE,
    });

    await user.click(restoreButton);

    const restoredSwitch = screen.getByRole('switch', {
      name: ANALYTICS_LABEL,
    });
    const unsavedRegion = screen.getByRole('region', { name: UNSAVED_CHANGES });

    expect(restoredSwitch).toBeChecked();
    expect(unsavedRegion).toHaveTextContent(ONE_UNSAVED_CHANGE);
  });
});
