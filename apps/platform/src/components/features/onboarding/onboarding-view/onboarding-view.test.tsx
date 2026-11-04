import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import messages from '@platform/i18n/messages/en.json';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { isInaccessible, screen } from '@platform/testing/custom-render';
import {
  clickBack,
  clickContinue,
  completeSiteStep,
  expectProgressAt,
  LANGUAGE_HINT,
  LANGUAGE_LABEL,
  MOCK_ADDRESS_FIELD,
  MOCK_BACK,
  MOCK_CONTINUE,
  MOCK_LIVE_PREVIEW,
  MOCK_NAME_FIELD,
  MOCK_PLACEHOLDER_ADDRESS,
  MOCK_SITE_TYPE_SELECT,
  NAME_HINT,
  NAME_REQUIRED,
  setup,
  SITE_ADDRESS_LABEL,
  SITE_TYPE_HINT,
  stepHeading,
  stepProgressText,
  STEPS,
} from '@platform/testing/onboarding/onboarding-view';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const MOCK_ANNOUNCED_PLACEHOLDER_ADDRESS = `${SITE_ADDRESS_LABEL} ${MOCK_PLACEHOLDER_ADDRESS}`;

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('names the signed-in email and offers a sign out', () => {
    const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });
    const signOutButton = screen.getByRole('button', {
      name: messages.account.signOut,
    });

    expect(email).toBeVisible();
    expect(signOutButton).toBeVisible();
  });

  it('describes the site type and name by their hints', () => {
    const siteTypeSelect = screen.getByRole('combobox', MOCK_SITE_TYPE_SELECT);
    const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

    expect(siteTypeSelect).toHaveAccessibleDescription(SITE_TYPE_HINT);
    expect(nameField).toHaveAccessibleDescription(NAME_HINT);
  });

  it('announces the first step as one named progress bar', () => {
    expectProgressAt(ONBOARDING_STEP.SITE);
  });

  it('hides the visible step text from assistive tech', () => {
    const visibleText = screen.getByText(
      stepProgressText(ONBOARDING_STEP.SITE),
    );

    expect(isInaccessible(visibleText)).toBe(true);
  });

  it('offers Continue alone on the first step', () => {
    const backButton = screen.queryByRole('button', MOCK_BACK);
    const continueButton = screen.queryByRole('button', MOCK_CONTINUE);

    expect(backButton).not.toBeInTheDocument();
    expect(continueButton).toBeInTheDocument();
  });

  describe('with Continue pressed before a name is typed', () => {
    beforeEach(async () => {
      await clickContinue(user);
    });

    it('asks for a name before leaving the first step', () => {
      const message = screen.getByText(NAME_REQUIRED);
      const heading = stepHeading(STEPS.SITE);

      expect(message).toBeVisible();
      expect(heading).toBeVisible();
    });

    it('describes an empty name by its hint, then what is missing', () => {
      const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

      expect(nameField).toBeInvalid();
      expect(nameField).toHaveAccessibleDescription(
        `${NAME_HINT} ${NAME_REQUIRED}`,
      );
    });
  });

  describe('on the address step', () => {
    beforeEach(async () => {
      await completeSiteStep(user);
    });

    it('shows a placeholder address in the preview before one is typed', () => {
      const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

      expect(preview).toHaveTextContent(MOCK_ANNOUNCED_PLACEHOLDER_ADDRESS);
    });

    it('follows the address in the preview as each letter is typed', async () => {
      const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
      const [firstLetter] = MOCK_TENANT_SLUG;
      await user.type(addressField, firstLetter ?? '');

      const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

      expect(preview).toHaveTextContent(
        `${SITE_ADDRESS_LABEL} ${firstLetter}.${MOCK_TENANT_ROOT_DOMAIN}`,
      );
    });

    it('describes the language select by its hint', () => {
      const languageSelect = screen.getByRole('combobox', {
        name: LANGUAGE_LABEL,
      });

      expect(languageSelect).toHaveAccessibleDescription(LANGUAGE_HINT);
    });

    it('moves the progress bar on to the next step on Continue', () => {
      expectProgressAt(ONBOARDING_STEP.ADDRESS);
    });

    it('offers Back beside Continue from the second step', () => {
      const backButton = screen.queryByRole('button', MOCK_BACK);
      const continueButton = screen.queryByRole('button', MOCK_CONTINUE);

      expect(backButton).toBeInTheDocument();
      expect(continueButton).toBeInTheDocument();
    });

    it('moves focus to the start of the new step on Continue', async () => {
      await user.tab();

      const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);

      expect(addressField).toHaveFocus();
    });

    describe('after Back', () => {
      beforeEach(async () => {
        await clickBack(user);
      });

      it('keeps the values entered when going back a step', () => {
        const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

        expect(nameField).toHaveValue(MOCK_TENANT_NAME);
      });

      it('moves the progress bar back a step on Back', () => {
        expectProgressAt(ONBOARDING_STEP.SITE);
      });

      it('moves focus to the start of the earlier step on Back', async () => {
        await user.tab();

        const siteTypeSelect = screen.getByRole(
          'combobox',
          MOCK_SITE_TYPE_SELECT,
        );

        expect(siteTypeSelect).toHaveFocus();
      });
    });
  });
});
