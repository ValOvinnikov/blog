import { ACTION_OUTCOME } from '@blog/config';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import { SIGN_UP_REFUSAL } from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { screen } from '@platform/testing/custom-render';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  acceptAndCreate,
  ADDRESS_TAKEN,
  createSiteMock,
  editFromReview,
  expectProgressAt,
  MOCK_ADDRESS_FIELD,
  returnToReviewAfterEditingName,
  setup,
  SITE_ADDRESS_LABEL,
  stepHeading,
  STEPS,
  TRY_AGAIN_LATER,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    createSiteMock.mockReset();
    setup();
  });

  describe('on review', () => {
    beforeEach(async () => {
      await reachReview(user);
    });

    it('returns to review after editing a step from it', async () => {
      await returnToReviewAfterEditingName(user);

      const heading = stepHeading(STEPS.REVIEW);

      expect(heading).toBeVisible();
    });

    it('returns to the address step when the address was taken meanwhile', async () => {
      createSiteMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
      });
      await acceptAndCreate(user);

      await screen.findAllByText(ADDRESS_TAKEN);
      const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
      const heading = stepHeading(STEPS.ADDRESS);

      expect(addressField).toHaveAccessibleDescription(
        expect.stringContaining(ADDRESS_TAKEN),
      );
      expect(heading).toBeVisible();
    });

    it('shows the neutral refusal when creation is refused', async () => {
      createSiteMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
      });
      await acceptAndCreate(user);

      const refusal = await screen.findByText(TRY_AGAIN_LATER);

      expect(refusal).toBeVisible();
    });

    describe('with the address opened from review', () => {
      beforeEach(async () => {
        await editFromReview(user, SITE_ADDRESS_LABEL);
      });

      it('moves the progress bar to the step opened from review', () => {
        expectProgressAt(ONBOARDING_STEP.ADDRESS);
      });

      it('opens a step from its Edit link on review', () => {
        const heading = stepHeading(STEPS.ADDRESS);

        expect(heading).toBeVisible();
      });
    });
  });
});
