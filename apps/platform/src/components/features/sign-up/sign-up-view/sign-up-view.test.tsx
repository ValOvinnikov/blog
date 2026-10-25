import { ACTION_OUTCOME } from '@blog/config';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { acceptSignupTermsAction } from '@platform/server/auth/accept-signup-terms-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/env/fixtures';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SignUpView } from './sign-up-view';

vi.mock('@platform/server/auth/accept-signup-terms-action', () => ({
  acceptSignupTermsAction: vi.fn(),
}));

const acceptMock = vi.mocked(acceptSignupTermsAction);
const MOCK_LEGAL_PAGE_URLS = toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN);
const MOCK_ACCEPTANCE = { name: /I agree to the Terms of Service/ };
const MOCK_CONTINUE = { name: 'Continue' };

const setup = customRender(SignUpView, {
  legalPageUrls: MOCK_LEGAL_PAGE_URLS,
});

describe(`<${SignUpView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    acceptMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    user = userEvent.setup();
  });

  describe('with the legal pages on the apex', () => {
    const acceptAndContinue = async () => {
      const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
      const continueButton = screen.getByRole('button', MOCK_CONTINUE);

      await user.click(acceptance);
      await user.click(continueButton);
    };

    beforeEach(() => {
      setup();
    });

    it('links the terms and privacy policy it asks the visitor to accept', () => {
      const terms = screen.getByRole('link', {
        name: 'Terms of Service (opens in new tab)',
      });
      const privacy = screen.getByRole('link', {
        name: 'Privacy Policy (opens in new tab)',
      });

      expect(terms).toHaveAttribute('href', MOCK_LEGAL_PAGE_URLS?.terms);
      expect(privacy).toHaveAttribute('href', MOCK_LEGAL_PAGE_URLS?.privacy);
    });

    it('submits the acceptance the visitor ticked', async () => {
      await acceptAndContinue();

      expect(acceptMock).toHaveBeenCalledWith({ hasAcceptedTerms: true });
    });

    it('asks for acceptance when the visitor continues without it', async () => {
      acceptMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
        },
      });

      const continueButton = screen.getByRole('button', MOCK_CONTINUE);

      await user.click(continueButton);

      const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);

      expect(acceptance).toBeInvalid();
    });

    it('shows the neutral refusal when the sign-up is refused', async () => {
      acceptMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
      });

      await acceptAndContinue();

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent('Try again later.');
    });
  });

  it('names the policies without links when there are no pages to link to', () => {
    setup({ legalPageUrls: undefined });

    const link = screen.queryByRole('link');
    const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);

    expect(link).not.toBeInTheDocument();
    expect(acceptance).toBeVisible();
  });
});
