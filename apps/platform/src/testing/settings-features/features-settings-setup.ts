import { FeaturesSettings } from '@platform/components/features/capabilities/features-settings/features-settings';
import messages from '@platform/i18n/messages/en.json';
import { updateAnalyticsAction } from '@platform/server/settings-features/update-analytics-action';
import { updateFeaturesAction } from '@platform/server/settings-features/update-features-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { SAVE } from '@platform/testing/render-in-settings-form';
import {
  mockFeaturesFormValues,
  mockSettingsFeaturesValues,
} from '@platform/testing/settings-features/fixtures';
import {
  MOCK_TENANT_ID,
  mockGrantAccess,
} from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME, CAPABILITY } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

const { toggleLabel } = messages.featuresSettings;

export const CONSENT_BANNER_LABEL = toggleLabel[CAPABILITY.CONSENT_BANNER];
export const CONTACT_FORM_LABEL = toggleLabel[CAPABILITY.CONTACT_FORM];

export const planLockedBadge = (plan: TTenantPlan) =>
  makeEnTranslator('featuresSettings')('planLockedBadge', { plan });

export const ALL_ENTITLED = Object.values(CAPABILITY);

export const MOCK_INITIAL_FEATURES = mockSettingsFeaturesValues({
  readerAccountsEnabled: true,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  contactFormEnabled: true,
});

export const setupFeaturesSettings = customRender(FeaturesSettings, {
  tenantId: MOCK_TENANT_ID,
  entitledCapabilities: ALL_ENTITLED,
  grants: mockGrantAccess(),
  hasOwnAnalytics: true,
  initialValues: mockFeaturesFormValues(MOCK_INITIAL_FEATURES),
});

export const prepareFeaturesSettings = () => {
  vi.mocked(updateFeaturesAction).mockResolvedValue({
    outcome: ACTION_OUTCOME.SUCCESS,
  });
  vi.mocked(updateAnalyticsAction).mockResolvedValue({
    outcome: ACTION_OUTCOME.SUCCESS,
  });
  return { user: userEvent.setup(), refresh: mockRouterRefresh() };
};

export const saveFeaturesSettings = async (user: UserEvent) => {
  const saveButton = screen.getByRole('button', { name: SAVE });
  await user.click(saveButton);
};
