import { ACTION_OUTCOME, CAPABILITY } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import messages from '@platform/i18n/messages/en.json';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  ARCHIVED_NOTICE_DESCRIPTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
  ONE_UNSAVED_CHANGE,
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
const MOCK_PARTIAL_ENTITLEMENT = [
  CAPABILITY.READER_ACCOUNTS,
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
];

const MOCK_INITIAL_VALUES = mockSettingsFeaturesValues({
  readerAccountsEnabled: true,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  contactFormEnabled: true,
});

const {
  heading,
  capabilitiesHeading,
  comingSoonBadge,
  alertSuccess,
  alertError,
  readerAccountNote,
  toggleLabel,
  toggleDescription,
} = messages.featuresSettings;

const READER_ACCOUNTS_LABEL = toggleLabel[CAPABILITY.READER_ACCOUNTS];
const BOOKMARKS_LABEL = toggleLabel[CAPABILITY.BOOKMARKS];
const ANALYTICS_LABEL = toggleLabel[CAPABILITY.ANALYTICS];
const CONTACT_FORM_LABEL = toggleLabel[CAPABILITY.CONTACT_FORM];
const { saveBar } = messages;
const planLockedBadge = (plan: TTenantPlan) =>
  makeEnTranslator('featuresSettings')('planLockedBadge', { plan });
const RESTORE_ONE_CHANGE = makeEnTranslator('draftRecovery')('restore', {
  count: 1,
});

const toggleAnalyticsAndSave = async (user: UserEvent) => {
  const analyticsSwitch = screen.getByRole('switch', {
    name: ANALYTICS_LABEL,
  });
  await user.click(analyticsSwitch);
  const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
  await user.click(saveButton);
};

const setup = customRender(FeaturesSettings, {
  tenantId: MOCK_TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  initialValues: MOCK_INITIAL_VALUES,
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
    let bookmarksSwitch: HTMLElement;
    let analyticsSwitch: HTMLElement;

    beforeEach(() => {
      setup();
      bookmarksSwitch = screen.getByRole('switch', { name: BOOKMARKS_LABEL });
      analyticsSwitch = screen.getByRole('switch', { name: ANALYTICS_LABEL });
    });

    it('renders one toggle per built capability, reflecting the initial values', () => {
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
      const switches = screen.getAllByRole('switch');

      expect(bookmarksSwitch).toBeChecked();
      expect(analyticsSwitch).not.toBeChecked();
      expect(contactFormSwitch).toBeChecked();
      expect(switches).toHaveLength(5);
    });

    it('badges only Newsletter "Coming soon"', () => {
      const badges = screen.getAllByText(comingSoonBadge);

      expect(badges).toHaveLength(1);
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

    it('offers no Save while the values are unchanged', () => {
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
      const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

      expect(saveButton).not.toBeInTheDocument();
      expect(allSaved).not.toBeInTheDocument();
    });

    describe('after toggling Bookmarks', () => {
      beforeEach(async () => {
        await user.click(bookmarksSwitch);
      });

      it('shows it switched off', () => {
        expect(bookmarksSwitch).not.toBeChecked();
      });

      it('saves the current toggle state', async () => {
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

        await user.click(saveButton);

        expect(updateFeaturesActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
          ...MOCK_INITIAL_VALUES,
          bookmarksEnabled: false,
        });
      });
    });

    describe('after toggling Analytics', () => {
      beforeEach(async () => {
        await user.click(analyticsSwitch);
      });

      it('counts an unsaved toggle and withdraws Save once it is toggled back', async () => {
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
        const discardButton = screen.getByRole('button', {
          name: saveBar.discard,
        });

        await user.click(discardButton);

        const allSaved = screen.queryByText(ALL_CHANGES_SAVED);

        expect(analyticsSwitch).not.toBeChecked();
        expect(allSaved).not.toBeInTheDocument();
      });
    });

    describe('after toggling Analytics and saving', () => {
      beforeEach(async () => {
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

  it.each([
    ['every', ALL_ENTITLED],
    ['some', MOCK_PARTIAL_ENTITLEMENT],
    ['no', []],
  ])(
    'shows no Comments or Ratings row with %s capabilities entitled',
    (_, entitledCapabilities) => {
      setup({ entitledCapabilities });

      const comments = screen.queryByText(toggleLabel[CAPABILITY.COMMENTS]);
      const ratings = screen.queryByText(toggleLabel[CAPABILITY.RATINGS]);

      expect(comments).not.toBeInTheDocument();
      expect(ratings).not.toBeInTheDocument();
    },
  );

  describe('with only some capabilities entitled', () => {
    let bookmarksSwitch: HTMLElement;
    let analyticsSwitch: HTMLElement;

    beforeEach(() => {
      setup({ entitledCapabilities: MOCK_PARTIAL_ENTITLEMENT });
      bookmarksSwitch = screen.getByRole('switch', { name: BOOKMARKS_LABEL });
      analyticsSwitch = screen.getByRole('switch', { name: ANALYTICS_LABEL });
    });

    it('shows Newsletter as "Coming soon" with no toggle, whatever the plan', () => {
      const label = toggleLabel[CAPABILITY.NEWSLETTER];
      const row = screen.getByText(label);
      const toggle = screen.queryByRole('switch', { name: label });

      expect(row).toBeVisible();
      expect(toggle).not.toBeInTheDocument();
    });

    it('shows an out-of-plan toggle disabled, never hidden', () => {
      const consentSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.CONSENT_BANNER],
      });
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });

      expect(analyticsSwitch).toBeDisabled();
      expect(consentSwitch).toBeDisabled();
      expect(contactFormSwitch).toBeDisabled();
      expect(bookmarksSwitch).toBeEnabled();
    });

    it('badges a locked toggle with the cheapest plan holding it', () => {
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });

      expect(contactFormSwitch).toHaveAccessibleDescription(
        `${toggleDescription[CAPABILITY.CONTACT_FORM]} ${planLockedBadge(TENANT_PLAN.STARTER)}`,
      );
    });

    it('adds the plan lock to the description of a locked toggle only', () => {
      expect(analyticsSwitch).toHaveAccessibleDescription(
        `${toggleDescription[CAPABILITY.ANALYTICS]} ${planLockedBadge(TENANT_PLAN.GROWTH)}`,
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
    await toggleAnalyticsAndSave(user);

    const savingButton = await screen.findByRole('button', {
      name: saveBar.saving,
    });

    expect(savingButton).toHaveAttribute('aria-disabled', 'true');

    resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

    const allSaved = await screen.findByText(ALL_CHANGES_SAVED);

    expect(allSaved).toBeVisible();
  });

  describe('when the save fails', () => {
    beforeEach(async () => {
      updateFeaturesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();
      await toggleAnalyticsAndSave(user);
      await screen.findByRole('alert');
    });

    it('shows the failure in the save bar and does not refresh', () => {
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const alert = within(saveBar).getByRole('alert');

      expect(alert).toHaveTextContent(alertError);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('clears the failure on the next edit', async () => {
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
      await user.click(contactFormSwitch);

      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });

    it('clears the failure once a retry saves', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await screen.findByText(ALL_CHANGES_SAVED);
      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });

    it('withdraws the failure during a retry and announces it again when the retry fails', async () => {
      let resolveAction: (value: TUpdateFeaturesResult) => void = () => {};
      updateFeaturesActionMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await screen.findByRole('button', { name: saveBar.saving });
      const alertDuringRetry = screen.queryByRole('alert');
      resolveAction({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      const alertAfterRetry = await screen.findByRole('alert');

      expect(alertDuringRetry).not.toBeInTheDocument();
      expect(alertAfterRetry).toHaveTextContent(alertError);
    });
  });

  describe('with Reader accounts off', () => {
    beforeEach(() => {
      setup({
        initialValues: mockSettingsFeaturesValues({ bookmarksEnabled: true }),
      });
    });

    it('tells the owner signed-in readers keep their account page', () => {
      const note = screen.getByText(readerAccountNote);

      expect(note).toBeVisible();
    });

    it('disables Bookmarks and keeps its stored value', () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(bookmarksSwitch).toBeDisabled();
      expect(bookmarksSwitch).toBeChecked();
    });

    describe('once Reader accounts is switched on', () => {
      beforeEach(async () => {
        const readerAccountsSwitch = screen.getByRole('switch', {
          name: READER_ACCOUNTS_LABEL,
        });

        await user.click(readerAccountsSwitch);
      });

      it('withdraws the note', () => {
        const note = screen.queryByText(readerAccountNote);

        expect(note).not.toBeInTheDocument();
      });

      it('enables Bookmarks', () => {
        const bookmarksSwitch = screen.getByRole('switch', {
          name: BOOKMARKS_LABEL,
        });

        expect(bookmarksSwitch).toBeEnabled();
      });
    });
  });

  it('shows no reader-account note while Reader accounts is on', () => {
    setup();

    const note = screen.queryByText(readerAccountNote);

    expect(note).not.toBeInTheDocument();
  });

  it('locks Reader accounts and Bookmarks on a plan without them', () => {
    setup({ entitledCapabilities: [CAPABILITY.CONSENT_BANNER] });

    const readerAccountsSwitch = screen.getByRole('switch', {
      name: READER_ACCOUNTS_LABEL,
    });
    const bookmarksSwitch = screen.getByRole('switch', {
      name: BOOKMARKS_LABEL,
    });

    expect(readerAccountsSwitch).toBeDisabled();
    expect(bookmarksSwitch).toBeDisabled();
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
