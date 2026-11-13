import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import en from '@platform/i18n/messages/en.json';
import type { TCreateTenantInput } from '@platform/server/tenants/create-tenant-input';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
  OWNER_EMAIL_LABEL,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantDetailsForm } from './tenant-details-form';

faker.seed(5994);

const { tenantDetailsForm, tenantFieldErrors, planNames, languageNames } = en;
const { EN, NL } = LOCALE_ISO_CODES;
const t = makeEnTranslator('tenantDetailsForm');

const MOCK_CONFIRMATION_TOKEN = faker.string.uuid();
const MOCK_EMAIL_EDIT_SUFFIX = `.${faker.string.alpha({ length: 2, casing: 'lower' })}`;
const MOCK_MIXED_CASE_OWNER_EMAIL = 'John.Doe@Example.com';
const MOCK_NORMALIZED_OWNER_EMAIL = MOCK_MIXED_CASE_OWNER_EMAIL.toLowerCase();
const OWNER_INVITE_CONFIRMATION = t('ownerInviteConfirmation', {
  email: MOCK_OWNER_EMAIL,
});
const BEGIN_PROVISIONING_BUTTON = { name: tenantDetailsForm.submitButton };
const CONFIRM_INVITE_BUTTON = {
  name: tenantDetailsForm.confirmOwnerInviteButton,
};

const { createTenantActionMock } = vi.hoisted(() => ({
  createTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: createTenantActionMock,
}));

const setup = customRender(TenantDetailsForm, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
});

const submittedValues = (overrides: Partial<TCreateTenantInput> = {}) => ({
  name: MOCK_TENANT_NAME,
  slug: MOCK_TENANT_SLUG,
  locale: EN,
  plan: TENANT_PLAN.FREE,
  ownerEmail: MOCK_OWNER_EMAIL,
  ...overrides,
});

const deferNextActionUntilServerError = () => {
  let resolveAction: (value: {
    outcome: typeof ACTION_OUTCOME.SERVER_ERROR;
  }) => void = () => {};
  createTenantActionMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
  );
  return () => resolveAction({ outcome: ACTION_OUTCOME.SERVER_ERROR });
};

const mockOwnerInviteUnconfirmed = (email: string) => {
  createTenantActionMock.mockResolvedValueOnce({
    outcome: ACTION_OUTCOME.REFUSED,
    reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
    email,
    token: MOCK_CONFIRMATION_TOKEN,
  });
};

describe(`<${TenantDetailsForm.name}/>`, () => {
  let user: UserEvent;

  const getNameInput = () =>
    screen.getByRole('textbox', { name: tenantDetailsForm.nameLabel });
  const getSiteAddressInput = () =>
    screen.getByRole('textbox', { name: tenantDetailsForm.siteAddressLabel });
  const getOwnerEmailInput = () =>
    screen.getByRole('textbox', { name: OWNER_EMAIL_LABEL });
  const getLanguageSelect = () =>
    screen.getByRole('combobox', { name: tenantDetailsForm.localeLabel });

  const fillForm = async (ownerEmail = MOCK_OWNER_EMAIL) => {
    await user.type(getNameInput(), MOCK_TENANT_NAME);
    await user.type(getSiteAddressInput(), MOCK_TENANT_SLUG);
    await user.type(getOwnerEmailInput(), ownerEmail);
  };

  const clickBeginProvisioning = async () => {
    const beginButton = await screen.findByRole(
      'button',
      BEGIN_PROVISIONING_BUTTON,
    );

    await user.click(beginButton);
  };

  const clickConfirmInviteOwner = async () => {
    const confirmButton = await screen.findByRole(
      'button',
      CONFIRM_INVITE_BUTTON,
    );

    await user.click(confirmButton);
  };

  beforeEach(() => {
    user = userEvent.setup();
    createTenantActionMock.mockReset();
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    setup();
  });

  it('renders every Details-step field', () => {
    const nameInput = getNameInput();
    const siteAddressInput = getSiteAddressInput();
    const planGroup = screen.getByRole('group', {
      name: tenantDetailsForm.planLabel,
    });
    const ownerEmailInput = getOwnerEmailInput();
    const languageSelect = getLanguageSelect();

    expect(nameInput).toBeVisible();
    expect(siteAddressInput).toBeVisible();
    expect(languageSelect).toBeVisible();
    expect(planGroup).toBeVisible();
    expect(ownerEmailInput).toBeVisible();
  });

  it('shows the fixed root-domain suffix beside the site address', () => {
    const suffix = screen.getByText(`.${MOCK_TENANT_ROOT_DOMAIN}`);

    expect(suffix).toBeVisible();
  });

  it('defaults the plan to Free', () => {
    const freeButton = screen.getByRole('button', {
      name: planNames[TENANT_PLAN.FREE],
    });

    expect(freeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('submits the entered values with the chosen plan', async () => {
    const growthButton = screen.getByRole('button', {
      name: planNames[TENANT_PLAN.GROWTH],
    });

    await fillForm();
    await user.click(growthButton);
    await clickBeginProvisioning();

    expect(createTenantActionMock).toHaveBeenCalledWith(
      submittedValues({ plan: TENANT_PLAN.GROWTH }),
    );
  });

  it("defaults the language to the platform's default language", () => {
    const languageSelect = getLanguageSelect();

    expect(languageSelect).toHaveTextContent(languageNames[EN]);
  });

  it('submits the chosen default language', async () => {
    await fillForm();
    await user.click(getLanguageSelect());
    const dutch = await screen.findByRole('option', {
      name: languageNames[NL],
    });
    await user.click(dutch);
    await clickBeginProvisioning();

    expect(createTenantActionMock).toHaveBeenCalledWith(
      submittedValues({ locale: NL }),
    );
  });

  it.each([
    {
      field: 'site address',
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
      errorText: tenantFieldErrors.slugTaken,
      getControl: () => getSiteAddressInput(),
    },
    {
      field: 'language',
      fieldErrors: {
        locale: { reason: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED },
      },
      errorText: tenantFieldErrors.localeUnsupported,
      getControl: () => getLanguageSelect(),
    },
    {
      field: 'owner email',
      fieldErrors: { ownerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
      errorText: tenantFieldErrors.emailInvalid,
      getControl: () => getOwnerEmailInput(),
    },
  ])(
    'marks the $field invalid and describes it by its returned error',
    async ({ fieldErrors, errorText, getControl }) => {
      createTenantActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors,
      });

      await fillForm();
      await clickBeginProvisioning();

      await screen.findByText(errorText);
      const control = getControl();

      expect(control).toBeInvalid();
      expect(control).toHaveAccessibleDescription(
        expect.stringContaining(errorText),
      );
    },
  );

  it('shows a failed create beside its button and keeps the entered values', async () => {
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await fillForm();
    await clickBeginProvisioning();

    const alert = await screen.findByRole('alert');
    const beginButton = await screen.findByRole(
      'button',
      BEGIN_PROVISIONING_BUTTON,
    );

    expect(alert).toHaveTextContent(tenantDetailsForm.errors.createFailed);
    expect(alert.compareDocumentPosition(beginButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(getNameInput()).toHaveValue(MOCK_TENANT_NAME);
    expect(getOwnerEmailInput()).toHaveValue(MOCK_OWNER_EMAIL);
  });

  it('clears a failed create when it is submitted again', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await fillForm();
    await clickBeginProvisioning();
    await screen.findByRole('alert');
    await clickBeginProvisioning();

    await waitFor(() => {
      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });
  });

  it('blocks the whole form behind a loading overlay while submitting', async () => {
    const resolveWithServerError = deferNextActionUntilServerError();

    await fillForm();
    await clickBeginProvisioning();

    const overlay = screen.getByRole('status', {
      name: tenantDetailsForm.submittingBeginButton,
    });
    const submitButton = screen.getByRole('button', {
      name: tenantDetailsForm.submittingBeginButton,
    });
    const inertForm = screen.getByTestId('tenant-details-form-inert');

    expect(overlay).toBeVisible();
    expect(submitButton).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(inertForm).toHaveAttribute('inert');

    resolveWithServerError();
    await waitFor(() => {
      const settledOverlay = screen.queryByRole('status', {
        name: tenantDetailsForm.submittingBeginButton,
      });

      expect(settledOverlay).not.toBeInTheDocument();
    });
  });

  describe('when the owner invite needs confirmation', () => {
    beforeEach(async () => {
      mockOwnerInviteUnconfirmed(MOCK_OWNER_EMAIL);
      await fillForm();
      await clickBeginProvisioning();
    });

    it('asks to confirm the owner invite without showing an error', async () => {
      const confirmButton = await screen.findByRole(
        'button',
        CONFIRM_INVITE_BUTTON,
      );
      const confirmation = screen.getByText(OWNER_INVITE_CONFIRMATION);
      const alert = screen.queryByRole('alert');

      expect(confirmButton).toBeVisible();
      expect(confirmation).toBeVisible();
      expect(alert).not.toBeInTheDocument();
    });

    it('resubmits with the confirmation token once the operator confirms', async () => {
      await clickConfirmInviteOwner();

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        submittedValues({ confirmOwnerInviteToken: MOCK_CONFIRMATION_TOKEN }),
      );
    });

    it('shows the inviting label while the confirmed submit is pending', async () => {
      const resolveWithServerError = deferNextActionUntilServerError();

      await clickConfirmInviteOwner();

      const overlay = screen.getByRole('status', {
        name: tenantDetailsForm.submittingInviteButton,
      });
      const submitButton = screen.getByRole('button', {
        name: tenantDetailsForm.submittingInviteButton,
      });

      expect(overlay).toBeVisible();
      expect(submitButton).toHaveAttribute(ARIA_DISABLED, 'true');

      resolveWithServerError();
      await waitFor(() => {
        const settledOverlay = screen.queryByRole('status', {
          name: tenantDetailsForm.submittingInviteButton,
        });

        expect(settledOverlay).not.toBeInTheDocument();
      });
    });

    it('drops the stale confirmation and token once the owner email is edited', async () => {
      await screen.findByText(OWNER_INVITE_CONFIRMATION);

      await user.type(getOwnerEmailInput(), MOCK_EMAIL_EDIT_SUFFIX);

      const staleConfirmation = screen.queryByText(OWNER_INVITE_CONFIRMATION);
      const beginButton = await screen.findByRole(
        'button',
        BEGIN_PROVISIONING_BUTTON,
      );
      expect(staleConfirmation).not.toBeInTheDocument();
      expect(beginButton).toBeVisible();

      await clickBeginProvisioning();

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        submittedValues({
          ownerEmail: `${MOCK_OWNER_EMAIL}${MOCK_EMAIL_EDIT_SUFFIX}`,
          confirmOwnerInviteToken: undefined,
        }),
      );
    });
  });

  it('keeps the confirmation when the owner email differs only by case', async () => {
    mockOwnerInviteUnconfirmed(MOCK_NORMALIZED_OWNER_EMAIL);

    await fillForm(MOCK_MIXED_CASE_OWNER_EMAIL);
    await clickBeginProvisioning();
    await clickConfirmInviteOwner();

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      submittedValues({
        ownerEmail: MOCK_MIXED_CASE_OWNER_EMAIL,
        confirmOwnerInviteToken: MOCK_CONFIRMATION_TOKEN,
      }),
    );
  });
});
