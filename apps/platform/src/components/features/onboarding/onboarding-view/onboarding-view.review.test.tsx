import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import { screen, within } from '@platform/testing/custom-render';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  acceptAndCreate,
  createSiteMock,
  EDITORIAL_PRESET,
  expectProgressAt,
  MOCK_BACK,
  MOCK_CREATE,
  MOCK_CREATE_SITE_INPUT,
  MOCK_SITE_ADDRESS,
  setup,
  SITE_TYPES,
  STEPS,
  STEPS_ARIA_LABEL,
  t,
} from '@platform/testing/onboarding/onboarding-view';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  describe('on review', () => {
    beforeEach(async () => {
      await reachReview(user);
    });

    it('creates the site from the values the user entered', async () => {
      await acceptAndCreate(user);

      expect(createSiteMock).toHaveBeenCalledWith(MOCK_CREATE_SITE_INPUT);
    });

    it.each([
      [
        STEPS.SITE,
        t('siteSummary', { siteType: SITE_TYPES.BLOG, name: MOCK_TENANT_NAME }),
      ],
      [STEPS.ADDRESS, MOCK_SITE_ADDRESS],
      [STEPS.LOOK, EDITORIAL_PRESET],
    ])('shows the %s step’s choice once it is done', (_, summary) => {
      const steps = screen.getByRole('list', { name: STEPS_ARIA_LABEL });

      const stepSummary = within(steps).getByText(summary);

      expect(stepSummary).toBeVisible();
    });

    it('announces review as the last step', () => {
      expectProgressAt(ONBOARDING_STEP.REVIEW);
    });

    it('offers Back beside Create site on review', () => {
      const backButton = screen.queryByRole('button', MOCK_BACK);
      const createButton = screen.queryByRole('button', MOCK_CREATE);

      expect(backButton).toBeInTheDocument();
      expect(createButton).toBeInTheDocument();
    });
  });
});
