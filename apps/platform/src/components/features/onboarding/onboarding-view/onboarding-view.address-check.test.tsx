import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import { act, screen } from '@platform/testing/custom-render';
import {
  ADDRESS_CHECKING,
  ADDRESS_TAKEN,
  ADDRESS_UNVERIFIED,
  clickContinue,
  completeSiteStep,
  MOCK_ADDRESS_AVAILABLE,
  MOCK_BACK,
  MOCK_CONTINUE,
  MOCK_LIVE_PREVIEW,
  MOCK_PLACEHOLDER_ADDRESS,
  MOCK_SITE_ADDRESS,
  setup,
  SITE_ADDRESS_HINT,
  SITE_ADDRESS_LABEL,
  stepHeading,
  STEPS,
  typeAddress,
} from '@platform/testing/onboarding/onboarding-view';
import {
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const checkSiteAddressMock = vi.mocked(checkSiteAddressAction);

const MOCK_ANNOUNCED_SITE_ADDRESS = `${SITE_ADDRESS_LABEL} ${MOCK_SITE_ADDRESS}`;

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    checkSiteAddressMock.mockReset();
    setup();
  });

  describe('on the address step', () => {
    beforeEach(async () => {
      await completeSiteStep(user);
    });

    describe('with an address typed', () => {
      let addressField: HTMLElement;

      beforeEach(async () => {
        addressField = await typeAddress(user);
      });

      it('says the address is free once it has been checked', async () => {
        const available = await screen.findByText(MOCK_ADDRESS_AVAILABLE);

        expect(available).toBeVisible();
        expect(checkSiteAddressMock).toHaveBeenLastCalledWith(MOCK_TENANT_SLUG);
      });

      it('shows the typed address in the preview', () => {
        const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

        expect(preview).toHaveTextContent(MOCK_ANNOUNCED_SITE_ADDRESS);
        expect(preview).not.toHaveTextContent(MOCK_PLACEHOLDER_ADDRESS);
      });

      it('keeps Continue disabled while the address is checked', () => {
        const checking = screen.getByText(ADDRESS_CHECKING);
        const continueButton = screen.getByRole('button', MOCK_CONTINUE);

        expect(checking).toBeVisible();
        expect(continueButton).toHaveAttribute('aria-disabled', 'true');
      });

      it('keeps Continue reachable by keyboard while the address is checked', async () => {
        const backButton = screen.getByRole('button', MOCK_BACK);
        act(() => backButton.focus());
        await user.tab();

        const continueButton = screen.getByRole('button', MOCK_CONTINUE);

        expect(continueButton).toHaveFocus();
      });

      it('stays on the address step when Enter is pressed during the check', async () => {
        await user.type(addressField, '{Enter}');

        const heading = stepHeading(STEPS.ADDRESS);

        expect(heading).toBeVisible();
      });
    });

    describe('when the address is taken', () => {
      let addressField: HTMLElement;

      beforeEach(async () => {
        checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
        addressField = await typeAddress(user);
        await screen.findAllByText(ADDRESS_TAKEN);
      });

      it('keeps a taken address from continuing', async () => {
        await clickContinue(user);

        const heading = stepHeading(STEPS.ADDRESS);

        expect(addressField).toBeInvalid();
        expect(heading).toBeVisible();
      });

      it('describes a taken address field by its suffix, hint and why it is taken', () => {
        expect(addressField).toHaveAccessibleDescription(
          `.${MOCK_TENANT_ROOT_DOMAIN} ${SITE_ADDRESS_HINT} ${ADDRESS_TAKEN}`,
        );
      });

      it('announces a taken address in a status region', () => {
        const announcing = screen
          .getAllByRole('status')
          .filter((status) => status.textContent === ADDRESS_TAKEN);

        expect(announcing).toHaveLength(1);
      });
    });

    describe('when the address check fails', () => {
      beforeEach(async () => {
        checkSiteAddressMock.mockRejectedValue(new Error());
        await typeAddress(user);
      });

      it('says when the address could not be checked', async () => {
        const unverified = await screen.findByText(ADDRESS_UNVERIFIED);

        expect(unverified).toBeVisible();
      });

      it('lets the user continue when the address check fails', async () => {
        await screen.findByText(ADDRESS_UNVERIFIED);
        await clickContinue(user);

        const heading = stepHeading(STEPS.LOOK);

        expect(heading).toBeVisible();
      });
    });
  });
});
