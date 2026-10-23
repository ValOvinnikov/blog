import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantDetailsForm } from './tenant-details-form';

const TENANT_NAME = 'Tenant name';
const OWNER_EMAIL = 'Owner email';
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
  await user.type(screen.getByRole('textbox', { name: TENANT_NAME }), 'Acme');
  await user.type(
    screen.getByRole('textbox', { name: 'Domain' }),
    MOCK_TENANT_DOMAIN,
  );
  await user.type(
    screen.getByRole('textbox', { name: OWNER_EMAIL }),
    MOCK_OWNER_EMAIL,
  );
};

const clickBeginProvisioning = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.click(screen.getByRole('button', { name: /begin provisioning/i }));
};

const clickConfirmInviteOwner = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.click(
    await screen.findByRole('button', { name: /confirm & invite owner/i }),
  );
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
    render(<TenantDetailsForm />);
  });

  it('renders every Details-step field from the mock shape', () => {
    expect(screen.getByRole('textbox', { name: TENANT_NAME })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Domain' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Plan' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: OWNER_EMAIL })).toBeVisible();
  });

  it('defaults the plan to Free', () => {
    expect(screen.getByRole('button', { name: 'Free' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('submits the current field values to createTenantAction', async () => {
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Growth' }));
    await clickBeginProvisioning(user);

    expect(createTenantActionMock).toHaveBeenCalledWith({
      name: 'Acme',
      domain: MOCK_TENANT_DOMAIN,
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
      expect(await screen.findByText(ENTER_A_VALID_EMAIL)).toBeVisible();
    });

    it('marks the field with a returned error invalid and describes it by that error', async () => {
      await screen.findByText(ENTER_A_VALID_EMAIL);

      const ownerEmail = screen.getByRole('textbox', { name: OWNER_EMAIL });
      expect(ownerEmail).toHaveAttribute('aria-invalid', 'true');
      expect(ownerEmail).toHaveAccessibleDescription(
        expect.stringContaining(ENTER_A_VALID_EMAIL),
      );
    });
  });

  it('shows a full-form loading overlay with a BEGINNING_PROVISIONING label for the initial submit', async () => {
    const resolveWithServerError = deferNextActionUntilServerError();

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    expect(
      screen.getByRole('status', { name: BEGINNING_PROVISIONING }),
    ).toBeVisible();
    const submitButton = screen.getByRole('button', {
      name: BEGINNING_PROVISIONING,
    });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('tenant-details-form-inert')).toHaveAttribute(
      'inert',
    );

    resolveWithServerError();
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: BEGINNING_PROVISIONING }),
      ).not.toBeInTheDocument(),
    );
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

    expect(screen.getByRole('status', { name: INVITING_OWNER })).toBeVisible();
    expect(screen.getByRole('button', { name: INVITING_OWNER })).toBeDisabled();

    resolveWithServerError();
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: INVITING_OWNER }),
      ).not.toBeInTheDocument(),
    );
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

    expect(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    ).toBeVisible();
    expect(screen.getByText(NO_ACCOUNT_FOUND_FOR_OWNER)).toBeVisible();
  });

  describe('when the owner invite needs confirmation', () => {
    beforeEach(async () => {
      mockOwnerInviteConfirmation({ email: MOCK_OWNER_EMAIL });
      await fillValidForm(user);
      await clickBeginProvisioning(user);
    });

    it('resubmits with confirmOwnerInviteToken set once the operator confirms an unchanged owner email', async () => {
      await clickConfirmInviteOwner(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ownerEmail: MOCK_OWNER_EMAIL,
        }),
      );
    });

    it('drops the stale confirmation and re-requires a fresh confirm once the owner email is edited', async () => {
      await screen.findByText(NO_ACCOUNT_FOUND_FOR_OWNER);

      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        '.uk',
      );
      expect(
        screen.queryByText(NO_ACCOUNT_FOUND_FOR_OWNER),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByRole('button', { name: /begin provisioning/i }),
      ).toBeVisible();

      await clickBeginProvisioning(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ownerEmail: `${MOCK_OWNER_EMAIL}.uk`,
        }),
      );
    });
  });

  it('resubmits with confirmOwnerInviteToken set when the owner email only differs from the server-normalized form by case or whitespace', async () => {
    mockOwnerInviteConfirmation({
      email: 'john.doe@example.com',
    });

    await user.type(screen.getByRole('textbox', { name: TENANT_NAME }), 'Acme');

    await user.type(
      screen.getByRole('textbox', { name: 'Domain' }),
      MOCK_TENANT_DOMAIN,
    );

    await user.type(
      screen.getByRole('textbox', { name: OWNER_EMAIL }),
      MIXED_CASE_OWNER_EMAIL,
    );
    await clickBeginProvisioning(user);
    await clickConfirmInviteOwner(user);

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: MIXED_CASE_OWNER_EMAIL,
      }),
    );
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

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ownerEmail: MOCK_OWNER_EMAIL,
          confirmOwnerInviteToken: OWNER_CONFIRMATION_TOKEN,
        }),
      );
    });

    it('drops the stale token along with the stale confirmation once the owner email is edited', async () => {
      await screen.findByText(NO_ACCOUNT_FOUND_FOR_OWNER);

      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        '.uk',
      );
      await clickBeginProvisioning(user);

      expect(createTenantActionMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ownerEmail: `${MOCK_OWNER_EMAIL}.uk`,
          confirmOwnerInviteToken: undefined,
        }),
      );
    });
  });

  it('shows a general error returned from the Server Action', async () => {
    createTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await fillValidForm(user);
    await clickBeginProvisioning(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't create the tenant",
    );
  });
});
