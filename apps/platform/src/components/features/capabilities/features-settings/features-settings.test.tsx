import {
  ANALYTICS_FIELD_ERROR,
  FEATURES_FIELD_ERROR,
} from '@platform/constants/settings-features';
import messages from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { updateAnalyticsAction } from '@platform/server/settings-features/update-analytics-action';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
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
import {
  mockFeaturesFormValues,
  mockSettingsFeaturesValues,
} from '@platform/testing/settings-features/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  mockGrantAccess,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import {
  ACTION_OUTCOME,
  CAPABILITY,
  LOCALE_ISO_CODES,
} from '@shinefold/config';
import {
  ANALYTICS_PROVIDER,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { PLAN_REGISTRY } from '@shinefold/db/constants';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FeaturesSettings } from './features-settings';

vi.mock('@platform/server/settings-features/update-features-action', () => ({
  updateFeaturesAction: vi.fn(),
}));

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

vi.mock('@platform/server/settings-features/update-analytics-action', () => ({
  updateAnalyticsAction: vi.fn(),
}));

const updateFeaturesActionMock = vi.mocked(updateFeaturesAction);
const updateAnalyticsActionMock = vi.mocked(updateAnalyticsAction);

const ALL_ENTITLED = Object.values(CAPABILITY);
const MOCK_PARTIAL_ENTITLEMENT = [
  CAPABILITY.READER_ACCOUNTS,
  CAPABILITY.COMMENTS,
  CAPABILITY.RATINGS,
  CAPABILITY.BOOKMARKS,
];

const MOCK_INITIAL_FEATURES = mockSettingsFeaturesValues({
  readerAccountsEnabled: true,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  contactFormEnabled: true,
});
const MOCK_INITIAL_VALUES = mockFeaturesFormValues(MOCK_INITIAL_FEATURES);

const {
  heading,
  capabilitiesHeading,
  comingSoonBadge,
  alertSuccess,
  alertError,
  readerAccountNote,
  toggleLabel,
  toggleDescription,
  analyticsProviderOption,
  analyticsIdLabel,
  analyticsIdInvalid,
  consentBannerRequiredNote,
  consentBannerRequiredError,
} = messages.featuresSettings;

const READER_ACCOUNTS_LABEL = toggleLabel[CAPABILITY.READER_ACCOUNTS];
const BOOKMARKS_LABEL = toggleLabel[CAPABILITY.BOOKMARKS];
const CONSENT_BANNER_LABEL = toggleLabel[CAPABILITY.CONSENT_BANNER];
const CONTACT_FORM_LABEL = toggleLabel[CAPABILITY.CONTACT_FORM];
const NEWSLETTER_LABEL = toggleLabel[CAPABILITY.NEWSLETTER];
const { saveBar, grantedBadge } = messages;
const tGrant = makeEnTranslator('grantEntitlement');
const tGrantedBadge = makeEnTranslator('grantedBadge');
const planLockedBadge = (plan: TTenantPlan) =>
  makeEnTranslator('featuresSettings')('planLockedBadge', { plan });
const RESTORE_ONE_CHANGE = makeEnTranslator('draftRecovery')('restore', {
  count: 1,
});

const toggleContactFormAndSave = async (user: UserEvent) => {
  const contactFormSwitch = screen.getByRole('switch', {
    name: CONTACT_FORM_LABEL,
  });
  await user.click(contactFormSwitch);
  const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
  await user.click(saveButton);
};

const setup = customRender(FeaturesSettings, {
  tenantId: MOCK_TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  grants: mockGrantAccess(),
  hasOwnAnalytics: true,
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
    updateAnalyticsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  describe('with every capability entitled', () => {
    let bookmarksSwitch: HTMLElement;
    let contactFormSwitch: HTMLElement;

    beforeEach(() => {
      setup();
      bookmarksSwitch = screen.getByRole('switch', { name: BOOKMARKS_LABEL });
      contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
    });

    it('renders a toggle per built capability bar Analytics, as initially set', () => {
      const consentSwitch = screen.getByRole('switch', {
        name: CONSENT_BANNER_LABEL,
      });
      const switches = screen.getAllByRole('switch');

      expect(bookmarksSwitch).toBeChecked();
      expect(consentSwitch).not.toBeChecked();
      expect(contactFormSwitch).toBeChecked();
      expect(switches).toHaveLength(5);
    });

    it('badges no row "Coming soon"', () => {
      const badge = screen.queryByText(comingSoonBadge);

      expect(badge).not.toBeInTheDocument();
    });

    describe('after switching Newsletter on', () => {
      let newsletterSwitch: HTMLElement;

      beforeEach(async () => {
        newsletterSwitch = screen.getByRole('switch', {
          name: NEWSLETTER_LABEL,
        });
        await user.click(newsletterSwitch);
      });

      it('shows it switched on', () => {
        expect(newsletterSwitch).toBeChecked();
      });

      it('switches it off again', async () => {
        await user.click(newsletterSwitch);

        expect(newsletterSwitch).not.toBeChecked();
      });
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
          ...MOCK_INITIAL_FEATURES,
          bookmarksEnabled: false,
        });
        expect(updateAnalyticsActionMock).not.toHaveBeenCalled();
      });
    });

    describe('after toggling Contact form', () => {
      beforeEach(async () => {
        await user.click(contactFormSwitch);
      });

      it('counts an unsaved toggle and withdraws Save once it is toggled back', async () => {
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        const unsavedRegion = screen.getByRole('region', {
          name: UNSAVED_CHANGES,
        });

        expect(saveButton).toBeVisible();
        expect(unsavedRegion).toHaveTextContent(ONE_UNSAVED_CHANGE);

        await user.click(contactFormSwitch);

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

        expect(contactFormSwitch).toBeChecked();
        expect(allSaved).not.toBeInTheDocument();
      });
    });

    describe('after toggling Contact form and saving', () => {
      beforeEach(async () => {
        await user.click(contactFormSwitch);

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

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'locks Newsletter on %s',
    async (plan) => {
      setup({ entitledCapabilities: PLAN_REGISTRY[plan] });
      const newsletterSwitch = screen.getByRole('switch', {
        name: NEWSLETTER_LABEL,
      });

      await user.click(newsletterSwitch);

      expect(newsletterSwitch).toHaveAttribute(ARIA_DISABLED, String(true));
      expect(newsletterSwitch).not.toBeChecked();
    },
  );

  describe('with only some capabilities entitled', () => {
    let bookmarksSwitch: HTMLElement;
    let consentSwitch: HTMLElement;
    let contactFormSwitch: HTMLElement;

    beforeEach(() => {
      setup({ entitledCapabilities: MOCK_PARTIAL_ENTITLEMENT });
      bookmarksSwitch = screen.getByRole('switch', { name: BOOKMARKS_LABEL });
      consentSwitch = screen.getByRole('switch', {
        name: CONSENT_BANNER_LABEL,
      });
      contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });
    });

    it('shows an out-of-plan toggle locked, never hidden', () => {
      expect(consentSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(contactFormSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(bookmarksSwitch).not.toHaveAttribute(ARIA_DISABLED);
    });

    it('keeps an out-of-plan toggle focusable but unchangeable', async () => {
      await user.click(consentSwitch);
      await user.keyboard(' ');

      expect(consentSwitch).toHaveFocus();
      expect(consentSwitch).toBeEnabled();
      expect(consentSwitch).not.toBeChecked();
    });

    it('badges a locked toggle with the cheapest plan holding it', () => {
      expect(contactFormSwitch).toHaveAccessibleDescription(
        `${toggleDescription[CAPABILITY.CONTACT_FORM]} ${planLockedBadge(TENANT_PLAN.STARTER)}`,
      );
    });

    it('adds the plan lock to the description of a locked toggle only', () => {
      expect(consentSwitch).toHaveAccessibleDescription(
        `${toggleDescription[CAPABILITY.CONSENT_BANNER]} ${planLockedBadge(TENANT_PLAN.FREE)}`,
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
    await toggleContactFormAndSave(user);

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
      await toggleContactFormAndSave(user);
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
        initialValues: mockFeaturesFormValues({ bookmarksEnabled: true }),
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

    expect(readerAccountsSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(bookmarksSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
  });

  describe('grants', () => {
    const OUT_OF_PLAN = [CAPABILITY.CONSENT_BANNER, CAPABILITY.CONTACT_FORM];
    const grantTrigger = (label: string) => ({
      name: tGrant('triggerAriaLabel', { item: label }),
    });

    describe('for a super admin on a plan without Reader accounts', () => {
      beforeEach(() => {
        setup({
          entitledCapabilities: OUT_OF_PLAN,
          grants: mockGrantAccess({ target: mockGrantTarget() }),
        });
      });

      it('offers a grant action before each plan-locked switch', () => {
        const readerAccountsGrant = screen.getByRole(
          'button',
          grantTrigger(READER_ACCOUNTS_LABEL),
        );
        const bookmarksGrant = screen.getByRole(
          'button',
          grantTrigger(BOOKMARKS_LABEL),
        );
        const readerAccountsSwitch = screen.getByRole('switch', {
          name: READER_ACCOUNTS_LABEL,
        });

        expect(readerAccountsGrant).toBeVisible();
        expect(bookmarksGrant).toBeVisible();
        expect(
          readerAccountsGrant.compareDocumentPosition(readerAccountsSwitch),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      });

      it('moves focus to the row switch once the capability is granted', async () => {
        vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.SUCCESS,
        });
        const trigger = screen.getByRole(
          'button',
          grantTrigger(READER_ACCOUNTS_LABEL),
        );
        await user.click(trigger);
        const confirm = await screen.findByRole('button', {
          name: messages.grantDialog.confirmButton,
        });
        await user.click(confirm);

        const readerAccountsSwitch = screen.getByRole('switch', {
          name: READER_ACCOUNTS_LABEL,
        });

        await waitFor(() => expect(readerAccountsSwitch).toHaveFocus());
      });

      it('offers no grant action on an entitled row', () => {
        const contactFormGrant = screen.queryByRole(
          'button',
          grantTrigger(CONTACT_FORM_LABEL),
        );

        expect(contactFormGrant).not.toBeInTheDocument();
      });
    });

    it('offers no grant action to anyone who cannot grant', () => {
      setup({ entitledCapabilities: OUT_OF_PLAN });

      const grantActions = screen.queryAllByRole('button', {
        name: new RegExp(tGrant('trigger')),
      });

      expect(grantActions).toHaveLength(0);
    });

    describe('a capability granted beyond the plan', () => {
      beforeEach(() => {
        setup({
          entitledCapabilities: [...OUT_OF_PLAN, CAPABILITY.READER_ACCOUNTS],
          grants: mockGrantAccess({
            granted: {
              [CAPABILITY.READER_ACCOUNTS]: { expiresAt: null },
            },
          }),
        });
      });

      it('shows Granted in place of the plan lock, and lets the switch work', () => {
        const readerAccountsSwitch = screen.getByRole('switch', {
          name: READER_ACCOUNTS_LABEL,
        });

        expect(readerAccountsSwitch).toHaveAccessibleDescription(
          `${toggleDescription[CAPABILITY.READER_ACCOUNTS]} ${grantedBadge.label}`,
        );
        expect(readerAccountsSwitch).not.toHaveAttribute(ARIA_DISABLED);
      });

      it('keeps the plan lock on a capability that is not granted', () => {
        const bookmarksSwitch = screen.getByRole('switch', {
          name: BOOKMARKS_LABEL,
        });

        expect(bookmarksSwitch).toHaveAccessibleDescription(
          `${toggleDescription[CAPABILITY.BOOKMARKS]} ${planLockedBadge(TENANT_PLAN.GROWTH)}`,
        );
      });
    });

    it('says until when a granted capability lasts', () => {
      setup({
        entitledCapabilities: [CAPABILITY.READER_ACCOUNTS],
        grants: mockGrantAccess({
          granted: {
            [CAPABILITY.READER_ACCOUNTS]: { expiresAt: MOCK_TENANT_CREATED_AT },
          },
        }),
      });

      const badge = screen.getByText(
        tGrantedBadge('labelUntil', {
          date: formatDate(MOCK_TENANT_CREATED_AT, LOCALE_ISO_CODES.EN),
        }),
      );

      expect(badge).toBeVisible();
    });
  });

  describe('for an archived tenant', () => {
    beforeEach(() => {
      setup({ archivedAt: MOCK_ARCHIVED_AT });
    });

    it('shows an archived notice and offers no Save', () => {
      expectArchivedOffersNoSave();
    });

    it('locks every capability toggle, including entitled ones', async () => {
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });

      expect(bookmarksSwitch).toBeEnabled();
      expect(bookmarksSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(bookmarksSwitch).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${toggleDescription[CAPABILITY.BOOKMARKS]}`,
      );

      await user.click(bookmarksSwitch);

      expect(bookmarksSwitch).toBeChecked();
    });
  });

  it('offers to restore unsaved toggles after leaving the page', async () => {
    const { unmount } = setup();
    const contactFormSwitch = screen.getByRole('switch', {
      name: CONTACT_FORM_LABEL,
    });

    await user.click(contactFormSwitch);
    unmount();

    setup();

    const restoreButton = screen.getByRole('button', {
      name: RESTORE_ONE_CHANGE,
    });

    await user.click(restoreButton);

    const restoredSwitch = screen.getByRole('switch', {
      name: CONTACT_FORM_LABEL,
    });
    const unsavedRegion = screen.getByRole('region', { name: UNSAVED_CHANGES });

    expect(restoredSwitch).not.toBeChecked();
    expect(unsavedRegion).toHaveTextContent(ONE_UNSAVED_CHANGE);
  });

  describe('the Analytics row', () => {
    const GOOGLE_ANALYTICS_OPTION =
      analyticsProviderOption[ANALYTICS_PROVIDER.GOOGLE_ANALYTICS];
    const PLAUSIBLE_OPTION =
      analyticsProviderOption[ANALYTICS_PROVIDER.PLAUSIBLE];
    const MEASUREMENT_ID_LABEL =
      analyticsIdLabel[ANALYTICS_PROVIDER.GOOGLE_ANALYTICS];
    const SITE_DOMAIN_LABEL = analyticsIdLabel[ANALYTICS_PROVIDER.PLAUSIBLE];
    const MOCK_SAVED_ANALYTICS_VALUES = mockFeaturesFormValues({
      ...MOCK_INITIAL_FEATURES,
      consentBannerEnabled: true,
      analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
      analyticsId: MOCK_GOOGLE_ANALYTICS.analyticsId,
    });

    const saveChanges = async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);
    };

    describe('with no id saved', () => {
      beforeEach(() => {
        setup();
      });

      it('saves a new Google Analytics id without re-saving the toggles', async () => {
        const idField = screen.getByRole('textbox', {
          name: MEASUREMENT_ID_LABEL,
        });

        await user.type(idField, MOCK_GOOGLE_ANALYTICS.analyticsId);
        await saveChanges();
        const toast = await screen.findByText(alertSuccess);

        expect(updateAnalyticsActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
          analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
          analyticsId: MOCK_GOOGLE_ANALYTICS.analyticsId,
        });
        expect(updateFeaturesActionMock).not.toHaveBeenCalled();
        expect(toast).toBeVisible();
      });

      it('asks for a site domain once Plausible is picked, and saves it', async () => {
        const plausibleOption = screen.getByRole('button', {
          name: PLAUSIBLE_OPTION,
        });

        await user.click(plausibleOption);
        const domainField = screen.getByRole('textbox', {
          name: SITE_DOMAIN_LABEL,
        });
        await user.type(domainField, MOCK_PLAUSIBLE_ANALYTICS.analyticsId);
        await saveChanges();

        expect(updateAnalyticsActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
          analyticsProvider: MOCK_PLAUSIBLE_ANALYTICS.provider,
          analyticsId: MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
        });
      });
    });

    it('keeps a saved id saved when the toggles then fail', async () => {
      updateFeaturesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setup();
      const idField = screen.getByRole('textbox', {
        name: MEASUREMENT_ID_LABEL,
      });
      const contactFormSwitch = screen.getByRole('switch', {
        name: CONTACT_FORM_LABEL,
      });

      await user.type(idField, MOCK_GOOGLE_ANALYTICS.analyticsId);
      await user.click(contactFormSwitch);
      await saveChanges();
      await screen.findByRole('alert');
      const discardButton = screen.getByRole('button', {
        name: saveBar.discard,
      });
      await user.click(discardButton);

      expect(idField).toHaveValue(MOCK_GOOGLE_ANALYTICS.analyticsId);
      expect(contactFormSwitch).toBeChecked();
    });

    it('saves a cleared id', async () => {
      setup({ initialValues: MOCK_SAVED_ANALYTICS_VALUES });
      const idField = screen.getByRole('textbox', {
        name: MEASUREMENT_ID_LABEL,
      });

      await user.clear(idField);
      await saveChanges();

      expect(updateAnalyticsActionMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
        analyticsId: '',
      });
    });

    describe('when the id is refused as malformed', () => {
      let idField: HTMLElement;

      beforeEach(async () => {
        updateAnalyticsActionMock.mockResolvedValueOnce({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            analyticsId: { reason: ANALYTICS_FIELD_ERROR.ID_INVALID },
          },
        });
        setup();
        idField = screen.getByRole('textbox', { name: MEASUREMENT_ID_LABEL });

        await user.type(idField, MOCK_PLAUSIBLE_ANALYTICS.analyticsId);
        await saveChanges();
        await waitFor(() => {
          expect(idField).toBeEnabled();
        });
      });

      it("describes the field with what the provider's id looks like", async () => {
        await waitFor(() => {
          expect(idField).toHaveAccessibleDescription(
            expect.stringContaining(
              analyticsIdInvalid[ANALYTICS_PROVIDER.GOOGLE_ANALYTICS],
            ),
          );
        });
      });

      it('saves none of the toggles', () => {
        expect(updateFeaturesActionMock).not.toHaveBeenCalled();
      });

      it('withdraws the message on the next keystroke', async () => {
        await user.type(idField, MOCK_GOOGLE_ANALYTICS.analyticsId);
        const message = screen.queryByText(
          analyticsIdInvalid[ANALYTICS_PROVIDER.GOOGLE_ANALYTICS],
        );

        expect(message).not.toBeInTheDocument();
      });
    });

    describe('with a Google Analytics id saved', () => {
      let consentSwitch: HTMLElement;

      beforeEach(() => {
        setup({ initialValues: MOCK_SAVED_ANALYTICS_VALUES });
        consentSwitch = screen.getByRole('switch', {
          name: CONSENT_BANNER_LABEL,
        });
      });

      it('locks the consent banner on, with the reason', () => {
        const note = screen.getByText(consentBannerRequiredNote);

        expect(consentSwitch).toBeChecked();
        expect(consentSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(note).toBeVisible();
      });

      it('unlocks the consent banner once Plausible is picked', async () => {
        const plausibleOption = screen.getByRole('button', {
          name: PLAUSIBLE_OPTION,
        });

        await user.click(plausibleOption);
        const note = screen.queryByText(consentBannerRequiredNote);

        expect(consentSwitch).not.toHaveAttribute(ARIA_DISABLED);
        expect(note).not.toBeInTheDocument();
      });

      it('lets the consent banner be switched off once the id is cleared', async () => {
        const idField = screen.getByRole('textbox', {
          name: MEASUREMENT_ID_LABEL,
        });

        await user.clear(idField);
        await user.click(consentSwitch);

        expect(consentSwitch).not.toBeChecked();
      });
    });

    it('switches the consent banner on for a typed Google Analytics id', async () => {
      setup();
      const idField = screen.getByRole('textbox', {
        name: MEASUREMENT_ID_LABEL,
      });
      const consentSwitch = screen.getByRole('switch', {
        name: CONSENT_BANNER_LABEL,
      });

      await user.type(idField, MOCK_GOOGLE_ANALYTICS.analyticsId);
      await saveChanges();
      await screen.findByText(alertSuccess);

      expect(consentSwitch).toBeChecked();
      expect(updateFeaturesActionMock).not.toHaveBeenCalled();
    });

    it('explains a refused consent banner switch-off', async () => {
      updateFeaturesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          consentBannerEnabled: {
            reason: FEATURES_FIELD_ERROR.CONSENT_BANNER_REQUIRED,
          },
        },
      });
      setup({
        initialValues: mockFeaturesFormValues({
          ...MOCK_INITIAL_FEATURES,
          consentBannerEnabled: true,
        }),
      });
      const consentSwitch = screen.getByRole('switch', {
        name: CONSENT_BANNER_LABEL,
      });

      await user.click(consentSwitch);
      await saveChanges();
      const message = await screen.findByText(consentBannerRequiredError);

      expect(message).toBeVisible();
    });

    describe('on a plan without its own analytics', () => {
      let plausibleOption: HTMLElement;

      beforeEach(() => {
        setup({
          hasOwnAnalytics: false,
          initialValues: MOCK_SAVED_ANALYTICS_VALUES,
        });
        plausibleOption = screen.getByRole('button', {
          name: PLAUSIBLE_OPTION,
        });
      });

      it('leaves the consent banner unlocked', () => {
        const consentSwitch = screen.getByRole('switch', {
          name: CONSENT_BANNER_LABEL,
        });
        const note = screen.queryByText(consentBannerRequiredNote);

        expect(consentSwitch).not.toHaveAttribute(ARIA_DISABLED);
        expect(note).not.toBeInTheDocument();
      });

      it('shows the kept id read-only', () => {
        const idField = screen.getByRole('textbox', {
          name: MEASUREMENT_ID_LABEL,
        });

        expect(idField).toHaveValue(MOCK_GOOGLE_ANALYTICS.analyticsId);
        expect(idField).toHaveAttribute('readonly');
      });

      it('locks the provider choice and badges the cheapest plan with it', () => {
        const badge = screen.getByText(planLockedBadge(TENANT_PLAN.STARTER));

        expect(plausibleOption).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(badge).toBeVisible();
      });

      it('keeps the provider when a locked option is pressed', async () => {
        await user.click(plausibleOption);

        const googleOption = screen.getByRole('button', {
          name: GOOGLE_ANALYTICS_OPTION,
        });

        expect(googleOption).toHaveAttribute(ARIA_PRESSED, 'true');
      });
    });
  });
});
