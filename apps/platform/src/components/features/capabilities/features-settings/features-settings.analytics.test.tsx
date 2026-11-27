import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import {
  ANALYTICS_FIELD_ERROR,
  FEATURES_FIELD_ERROR,
} from '@platform/constants/settings-features';
import messages from '@platform/i18n/messages/en.json';
import { updateAnalyticsAction } from '@platform/server/settings-features/update-analytics-action';
import { updateFeaturesAction } from '@platform/server/settings-features/update-features-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_DESCRIPTION } from '@platform/testing/render-in-settings-form';
import {
  CONSENT_BANNER_LABEL,
  CONTACT_FORM_LABEL,
  MOCK_INITIAL_FEATURES,
  planLockedBadge,
  prepareFeaturesSettings,
  saveFeaturesSettings,
  setupFeaturesSettings as setup,
} from '@platform/testing/settings-features/features-settings-setup';
import { mockFeaturesFormValues } from '@platform/testing/settings-features/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { ANALYTICS_PROVIDER, TENANT_PLAN } from '@shinefold/config/constants';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import type { UserEvent } from '@testing-library/user-event';

import { FeaturesSettings } from './features-settings';

vi.mock('@platform/server/settings-features/update-features-action', () => ({
  updateFeaturesAction: vi.fn(),
}));

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

vi.mock('@platform/server/settings-features/update-analytics-action', () => ({
  updateAnalyticsAction: vi.fn(),
}));

const {
  alertSuccess,
  analyticsProviderLabel,
  analyticsProviderOption,
  analyticsIdLabel,
  analyticsIdInvalid,
  consentBannerRequiredNote,
  consentBannerRequiredError,
} = messages.featuresSettings;
const { saveBar } = messages;

describe(`<${FeaturesSettings.name}/> Analytics row`, () => {
  let user: UserEvent;

  beforeEach(() => {
    ({ user } = prepareFeaturesSettings());
  });

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

  describe('with no id saved', () => {
    beforeEach(() => {
      setup();
    });

    it('saves a new Google Analytics id without re-saving the toggles', async () => {
      const idField = screen.getByRole('textbox', {
        name: MEASUREMENT_ID_LABEL,
      });

      await user.type(idField, MOCK_GOOGLE_ANALYTICS.analyticsId);
      await saveFeaturesSettings(user);
      const toast = await screen.findByText(alertSuccess);

      expect(vi.mocked(updateAnalyticsAction)).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        {
          analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
          analyticsId: MOCK_GOOGLE_ANALYTICS.analyticsId,
        },
      );
      expect(vi.mocked(updateFeaturesAction)).not.toHaveBeenCalled();
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
      await saveFeaturesSettings(user);

      expect(vi.mocked(updateAnalyticsAction)).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        {
          analyticsProvider: MOCK_PLAUSIBLE_ANALYTICS.provider,
          analyticsId: MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
        },
      );
    });
  });

  it('keeps a saved id saved when the toggles then fail', async () => {
    vi.mocked(updateFeaturesAction).mockResolvedValueOnce({
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
    await saveFeaturesSettings(user);
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
    await saveFeaturesSettings(user);

    expect(vi.mocked(updateAnalyticsAction)).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      {
        analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
        analyticsId: '',
      },
    );
  });

  describe('when the id is refused as malformed', () => {
    let idField: HTMLElement;

    beforeEach(async () => {
      vi.mocked(updateAnalyticsAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          analyticsId: { reason: ANALYTICS_FIELD_ERROR.ID_INVALID },
        },
      });
      setup();
      idField = screen.getByRole('textbox', { name: MEASUREMENT_ID_LABEL });

      await user.type(idField, MOCK_PLAUSIBLE_ANALYTICS.analyticsId);
      await saveFeaturesSettings(user);
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
      expect(vi.mocked(updateFeaturesAction)).not.toHaveBeenCalled();
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
      expect(consentSwitch).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(note).toBeVisible();
    });

    it('unlocks the consent banner once Plausible is picked', async () => {
      const plausibleOption = screen.getByRole('button', {
        name: PLAUSIBLE_OPTION,
      });

      await user.click(plausibleOption);
      const note = screen.queryByText(consentBannerRequiredNote);

      expect(consentSwitch).not.toHaveAttribute(ARIA_ATTRIBUTE.DISABLED);
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
    await saveFeaturesSettings(user);
    await screen.findByText(alertSuccess);

    expect(consentSwitch).toBeChecked();
    expect(vi.mocked(updateFeaturesAction)).not.toHaveBeenCalled();
  });

  it('explains a refused consent banner switch-off', async () => {
    vi.mocked(updateFeaturesAction).mockResolvedValueOnce({
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
    await saveFeaturesSettings(user);
    const message = await screen.findByText(consentBannerRequiredError);

    expect(message).toBeVisible();
  });

  describe('for an archived tenant', () => {
    let providerGroup: HTMLElement;
    let plausibleOption: HTMLElement;
    let idField: HTMLElement;

    beforeEach(() => {
      setup({
        archivedAt: MOCK_ARCHIVED_AT,
        initialValues: MOCK_SAVED_ANALYTICS_VALUES,
      });
      providerGroup = screen.getByRole('group', {
        name: analyticsProviderLabel,
      });
      plausibleOption = screen.getByRole('button', { name: PLAUSIBLE_OPTION });
      idField = screen.getByRole('textbox', { name: MEASUREMENT_ID_LABEL });
    });

    it('keeps the provider choice and the id field focusable but locked', () => {
      expect(plausibleOption).toBeEnabled();
      expect(plausibleOption).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(idField).toBeEnabled();
      expect(idField).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    });

    it('describes both by the archived notice', () => {
      expect(providerGroup).toHaveAccessibleDescription(
        expect.stringContaining(ARCHIVED_NOTICE_DESCRIPTION),
      );
      expect(idField).toHaveAccessibleDescription(
        expect.stringContaining(ARCHIVED_NOTICE_DESCRIPTION),
      );
    });

    it('ignores a provider click and typing in the id field', async () => {
      await user.click(plausibleOption);
      await user.type(idField, MOCK_PLAUSIBLE_ANALYTICS.analyticsId);
      const googleOption = screen.getByRole('button', {
        name: GOOGLE_ANALYTICS_OPTION,
      });

      expect(googleOption).toBePressed();
      expect(idField).toHaveValue(MOCK_GOOGLE_ANALYTICS.analyticsId);
    });
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

      expect(consentSwitch).not.toHaveAttribute(ARIA_ATTRIBUTE.DISABLED);
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

      expect(plausibleOption).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(badge).toBeVisible();
    });

    it('keeps the provider when a locked option is pressed', async () => {
      await user.click(plausibleOption);

      const googleOption = screen.getByRole('button', {
        name: GOOGLE_ANALYTICS_OPTION,
      });

      expect(googleOption).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
    });
  });
});
