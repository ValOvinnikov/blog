import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import en from '@platform/i18n/messages/en.json';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
  OWNER_EMAIL_LABEL,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantDetailsForm } from './tenant-details-form';

const TENANT_NAME = 'Tenant name';
const SITE_ADDRESS_LABEL = 'Site address';
const NEW_TENANT_NAME = 'Acme';
const ENTER_A_VALID_EMAIL = 'Enter a valid email.';
const BEGINNING_PROVISIONING = 'Beginning provisioning…';
const CONFIRMATION_TOKEN = 'confirmation-token';
const INVITING_OWNER = 'Inviting owner…';
const MIXED_CASE_OWNER_EMAIL = 'John.Doe@Example.com';
const OWNER_CONFIRMATION_TOKEN = 'confirmation-token-for-owner-example-com';

const render = renderWithIntl;

const { createTenantActionMock } = vi.hoisted(() => ({
  createTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: createTenantActionMock,
}));

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  const nameInput = screen.getByRole('textbox', { name: TENANT_NAME });
  const siteAddressInput = screen.getByRole('textbox', {
    name: SITE_ADDRESS_LABEL,
  });
  const ownerEmailInput = screen.getByRole('textbox', {
    name: OWNER_EMAIL_LABEL,
  });

  await user.type(nameInput, NEW_TENANT_NAME);
  await user.type(siteAddressInput, MOCK_TENANT_SLUG);
  await user.type(ownerEmailInput, MOCK_OWNER_EMAIL);
};

const clickBeginProvisioning = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  const beginButton = screen.getByRole('button', {
    name: /begin provisioning/i,
  });

  await user.click(beginButton);
};

const clickConfirmInviteOwner = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  const confirmButton = await screen.findByRole('button', {
    name: /confirm & invite owner/i,
  });

  await user.click(confirmButton);
};

const mockOwnerInviteConfirmation = (overrides: {
  email: string;
  token?: string;
}) => {
  createTenantActionMock.mockResolvedValueOnce({
    outcome: ACTION_OUTCOME.REFUSED,
    reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
    ...overrides,
  });
  createTenantActionMock.mockResolvedValueOnce({
    outcome: ACTION_OUTCOME.INVALID,
    fieldErrors: {},
  });
};

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

const NO_ACCOUNT_FOUND_FOR_OWNER = `No account found for ${MOCK_OWNER_EMAIL} — they'll be sent an invite to sign in and manage this tenant as owner.`;

describe(`<${TenantDetailsForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    createTenantActionMock.mockReset();
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    render(<TenantDetailsForm rootDomain={MOCK_TENANT_ROOT_DOMAIN} />);
  });

  it('renders every Details-step field from the mock shape', () => {
    const nameInput = screen.getByRole('textbox', { name: TENANT_NAME });
    const siteAddressInput = screen.getByRole('textbox', {
      name: SITE_ADDRESS_LABEL,
    });
    const planGroup = screen.getByRole('group', { name: 'Plan' });
    const ownerEmailInput = screen.getByRole('textbox', {
      name: OWNER_EMAIL_LABEL,
    });

    expect(nameInput).toBeVisible();
    expect(siteAddressInput).toBeVisible();
    expect(planGroup).toBeVisible();
    expect(ownerEmailInput).toBeVisible();
  });

  it('shows the fixed root-domain suffix beside the site address', () => {
    const suffix = screen.getByText(`.${MOCK_TENANT_ROOT_DOMAIN}`);

    expect(suffix).toBeVisible();
  });

  it('shows a taken site address error beside the field', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    const slugError = await screen.findByText(en.tenantFieldErrors.slugTaken);

    expect(slugError).toBeVisible();
  });

  it('defaults the plan to Free', () => {
    const freeButton = screen.getByRole('button', { name: 'Free' });

    expect(freeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('submits the current field values to createTenantAction', async () => {
    const growthButton = screen.getByRole('button', { name: 'Growth' });

    await fillValidForm(user);
    await user.click(growthButton);
    await clickBeginProvisioning(user);

    expect(createTenantActionMock).toHaveBeenCalledWith({
      name: NEW_TENANT_NAME,
      slug: MOCK_TENANT_SLUG,
      plan: TENANT_PLAN.GROWTH,
      ownerEmail: MOCK_OWNER_EMAIL,
    });
  });

  describe('when the Server Action rejects the owner email', () => {
    beforeEach(async () => {
      createTenantActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          ownerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
        },
      });
      await fillValidForm(user);
      await clickBeginProvisioning(user);
    });

    it('shows a field-level error returned from the Server Action', async () => {
      const fieldError = await screen.findByText(ENTER_A_VALID_EMAIL);

      expect(fieldError).toBeVisible();
    });

    it('marks the field with a returned error invalid and describes it by that error', async () => {
      await screen.findByText(ENTER_A_VALID_EMAIL);

      const ownerEmail = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmail).toHaveAttribute('aria-invalid', 'true');
      expect(ownerEmail).toHaveAccessibleDescription(
        `${en.tenantDetailsForm.ownerEmailHint} ${ENTER_A_VALID_EMAIL}`,
      );
    });
  });

  it('shows a full-form loading overlay with a BEGINNING_PROVISIONING label for the initial submit', async () => {
    const resolveWithServerError = deferNextActionUntilServerError();

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    const overlay = screen.getByRole('status', {
      name: BEGINNING_PROVISIONING,
    });
    const submitButton = screen.getByRole('button', {
      name: BEGINNING_PROVISIONING,
    });
    const inertForm = screen.getByTestId('tenant-details-form-inert');

    expect(overlay).toBeVisible();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(inertForm).toHaveAttribute('inert');

    resolveWithServerError();
    await waitFor(() => {
      const settledOverlay = screen.queryByRole('status', {
        name: BEGINNING_PROVISIONING,
      });

      expect(settledOverlay).not.toBeInTheDocument();
    });
  });

  it('shows an INVITING_OWNER pending label for the owner-invite confirmation submit', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: MOCK_OWNER_EMAIL,
      token: CONFIRMATION_TOKEN,
    });
    const resolveWithServerError = deferNextActionUntilServerError();

    await fillValidForm(user);
    await clickBeginProvisioning(user);
    await clickConfirmInviteOwner(user);

    const overlay = screen.getByRole('status', { name: INVITING_OWNER });
    const submitButton = screen.getByRole('button', { name: INVITING_OWNER });

    expect(overlay).toBeVisible();
    expect(submitButton).toBeDisabled();

    resolveWithServerError();
    await waitFor(() => {
      const settledOverlay = screen.queryByRole('status', {
        name: INVITING_OWNER,
      });

      expect(settledOverlay).not.toBeInTheDocument();
    });
  });

  it('shows a soft owner-invite confirmation, not a blocking error, for an unregistered owner email', async () => {
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: MOCK_OWNER_EMAIL,
      token: CONFIRMATION_TOKEN,
    });

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    const confirmButton = await screen.findByRole('button', {
      name: /confirm & invite owner/i,
    });
    const confirmation = screen.getByText(NO_ACCOUNT_FOUND_FOR_OWNER);

    expect(confirmButton).toBeVisible();
    expect(confirmation).toBeVisible();
  });

  describe('when the owner invite needs confirmation', () => {
    beforeEach(async () => {
      mockOwnerInviteConfirmation({ email: MOCK_OWNER_EMAIL });
      await fillValidForm(user);
      await clickBeginProvisioning(user);
    });

    it('resubmits with confirmOwnerInviteToken set once the operator confirms an unchanged owner email', async () => {
      await clickConfirmInviteOwner(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith({
        name: NEW_TENANT_NAME,
        slug: MOCK_TENANT_SLUG,
        plan: TENANT_PLAN.FREE,
        ownerEmail: MOCK_OWNER_EMAIL,
      });
    });

    it('drops the stale confirmation and re-requires a fresh confirm once the owner email is edited', async () => {
      await screen.findByText(NO_ACCOUNT_FOUND_FOR_OWNER);

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.type(ownerEmailInput, '.uk');

      const staleConfirmation = screen.queryByText(NO_ACCOUNT_FOUND_FOR_OWNER);
      const beginButton = await screen.findByRole('button', {
        name: /begin provisioning/i,
      });

      expect(staleConfirmation).not.toBeInTheDocument();
      expect(beginButton).toBeVisible();

      await clickBeginProvisioning(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith({
        name: NEW_TENANT_NAME,
        slug: MOCK_TENANT_SLUG,
        plan: TENANT_PLAN.FREE,
        ownerEmail: `${MOCK_OWNER_EMAIL}.uk`,
      });
    });
  });

  it('resubmits with confirmOwnerInviteToken set when the owner email only differs from the server-normalized form by case or whitespace', async () => {
    mockOwnerInviteConfirmation({
      email: 'john.doe@example.com',
    });

    const nameInput = screen.getByRole('textbox', { name: TENANT_NAME });
    const siteAddressInput = screen.getByRole('textbox', {
      name: SITE_ADDRESS_LABEL,
    });
    const ownerEmailInput = screen.getByRole('textbox', {
      name: OWNER_EMAIL_LABEL,
    });

    await user.type(nameInput, NEW_TENANT_NAME);
    await user.type(siteAddressInput, MOCK_TENANT_SLUG);
    await user.type(ownerEmailInput, MIXED_CASE_OWNER_EMAIL);
    await clickBeginProvisioning(user);
    await clickConfirmInviteOwner(user);

    expect(createTenantActionMock).toHaveBeenLastCalledWith({
      name: NEW_TENANT_NAME,
      slug: MOCK_TENANT_SLUG,
      plan: TENANT_PLAN.FREE,
      ownerEmail: MIXED_CASE_OWNER_EMAIL,
    });
  });

  describe('when the owner invite needs confirmation with a token', () => {
    beforeEach(async () => {
      mockOwnerInviteConfirmation({
        email: MOCK_OWNER_EMAIL,
        token: OWNER_CONFIRMATION_TOKEN,
      });
      await fillValidForm(user);
      await clickBeginProvisioning(user);
    });

    it('echoes the confirmation token back once the operator confirms an unchanged owner email', async () => {
      await clickConfirmInviteOwner(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith({
        name: NEW_TENANT_NAME,
        slug: MOCK_TENANT_SLUG,
        plan: TENANT_PLAN.FREE,
        ownerEmail: MOCK_OWNER_EMAIL,
        confirmOwnerInviteToken: OWNER_CONFIRMATION_TOKEN,
      });
    });

    it('drops the stale token along with the stale confirmation once the owner email is edited', async () => {
      await screen.findByText(NO_ACCOUNT_FOUND_FOR_OWNER);

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.type(ownerEmailInput, '.uk');
      await clickBeginProvisioning(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith({
        name: NEW_TENANT_NAME,
        slug: MOCK_TENANT_SLUG,
        plan: TENANT_PLAN.FREE,
        ownerEmail: `${MOCK_OWNER_EMAIL}.uk`,
        confirmOwnerInviteToken: undefined,
      });
    });
  });

  it('shows a general error returned from the Server Action', async () => {
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent("Couldn't create the tenant");
  });
});
