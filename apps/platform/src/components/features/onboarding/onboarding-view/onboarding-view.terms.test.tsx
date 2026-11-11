import { ACTION_OUTCOME } from '@blog/config';
import { SIGN_UP_FIELD_ERROR } from '@platform/constants/sign-up';
import { screen } from '@platform/testing/custom-render';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  clickCreate,
  createSiteMock,
  MOCK_ACCEPTANCE,
  returnToReviewAfterEditingName,
  setup,
  stepHeading,
  STEPS,
  TERMS_NOT_ACCEPTED,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const MOCK_TERMS_NOT_ACCEPTED_RESULT = {
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: {
    hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
  },
} as const;

const expectReviewWithoutTermsError = () => {
  const heading = stepHeading(STEPS.REVIEW);
  const termsError = screen.queryByText(TERMS_NOT_ACCEPTED);

  expect(heading).toBeVisible();
  expect(createSiteMock).not.toHaveBeenCalled();
  expect(termsError).not.toBeInTheDocument();
};

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    createSiteMock.mockReset();
    setup();
  });

  describe('when creation reports the terms unaccepted', () => {
    beforeEach(async () => {
      createSiteMock.mockResolvedValue(MOCK_TERMS_NOT_ACCEPTED_RESULT);
      await reachReview(user);
    });

    it('neither creates the site nor flags the terms on arriving at review', () => {
      expectReviewWithoutTermsError();
    });

    it('neither creates the site nor flags the terms on returning to review from an edit', async () => {
      await returnToReviewAfterEditingName(user);

      expectReviewWithoutTermsError();
    });

    describe('after Create site is pressed with the box unticked', () => {
      beforeEach(async () => {
        await clickCreate(user);
      });

      it('flags the terms when Create site is pressed with the box unticked', async () => {
        const message = await screen.findByText(TERMS_NOT_ACCEPTED);

        expect(message).toBeVisible();
      });

      it('clears the terms error once the box is ticked', async () => {
        await screen.findByText(TERMS_NOT_ACCEPTED);
        const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
        await user.click(acceptance);

        const termsError = screen.queryByText(TERMS_NOT_ACCEPTED);

        expect(termsError).not.toBeInTheDocument();
      });
    });
  });
});
