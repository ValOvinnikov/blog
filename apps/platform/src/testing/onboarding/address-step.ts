import { SITE_ADDRESS_CHECK_DELAY_MS } from '@platform/constants/onboarding';
import { screen } from '@platform/testing/custom-render';
import {
  clickContinue,
  completeSiteStep,
  MOCK_ADDRESS_AVAILABLE,
  MOCK_ADDRESS_FIELD,
} from '@platform/testing/onboarding/onboarding-view';
import { MOCK_TENANT_SLUG } from '@platform/testing/tenants/fixtures';
import type { UserEvent } from '@testing-library/user-event';

// A busy CI runner can take over a second to settle the check once its delay ends.
export const ADDRESS_CHECK_TIMEOUT = {
  timeout: SITE_ADDRESS_CHECK_DELAY_MS + 2_000,
};

export const typeAddress = async (user: UserEvent) => {
  const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
  await user.click(addressField);
  await user.paste(MOCK_TENANT_SLUG);
  return addressField;
};

export const completeAddressStep = async (user: UserEvent) => {
  await typeAddress(user);
  await screen.findByText(MOCK_ADDRESS_AVAILABLE, {}, ADDRESS_CHECK_TIMEOUT);
  await clickContinue(user);
};

export const reachReview = async (user: UserEvent) => {
  await completeSiteStep(user);
  await completeAddressStep(user);
  await clickContinue(user);
};
