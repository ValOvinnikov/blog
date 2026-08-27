import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { TenantDetailsForm } from './tenant-details-form';

const render = renderWithIntl;

const { createTenantActionMock } = vi.hoisted(() => ({
  createTenantActionMock: vi.fn(),
}));

vi.mock('@admin/server/tenants/create-tenant-action', () => ({
  createTenantAction: createTenantActionMock,
}));

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: 'Tenant name' }), 'Acme');
  await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'acme');
  await user.type(
    screen.getByRole('textbox', { name: 'Domain' }),
    'acme.example.com',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Owner email' }),
    'owner@example.com',
  );
};

describe(TenantDetailsForm, () => {
  beforeEach(() => {
    createTenantActionMock.mockReset();
    createTenantActionMock.mockResolvedValue({ ok: false });
  });

  it('renders every Details-step field from the mock shape', () => {
    render(<TenantDetailsForm />);

    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Slug' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Domain' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Plan' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Owner email' })).toBeVisible();
  });

  it('defaults the plan to Free', () => {
    render(<TenantDetailsForm />);

    expect(screen.getByRole('button', { name: 'Free' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('submits the current field values to createTenantAction', async () => {
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Growth' }));
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(createTenantActionMock).toHaveBeenCalledWith({
      name: 'Acme',
      slug: 'acme',
      domain: 'acme.example.com',
      plan: 'GROWTH',
      ownerEmail: 'owner@example.com',
    });
  });

  it('shows a field-level error returned from the Server Action', async () => {
    createTenantActionMock.mockResolvedValue({
      ok: false,
      fieldErrors: { ownerEmail: 'No registered user matches this email.' },
    });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(
      await screen.findByText('No registered user matches this email.'),
    ).toBeVisible();
  });

  it('shows a full-form loading overlay with a "Beginning provisioning…" label for the initial submit', async () => {
    let resolveAction: (value: { ok: boolean }) => void = () => {};
    createTenantActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(
      screen.getByRole('status', { name: 'Beginning provisioning…' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Beginning provisioning…' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Tenant name' }).closest('[inert]'),
    ).not.toBeNull();

    resolveAction({ ok: false });
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: 'Beginning provisioning…' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows an "Inviting owner…" pending label for the owner-invite confirmation submit', async () => {
    let resolveAction: (value: { ok: boolean }) => void = () => {};
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: 'confirmation-token',
        message: 'No account found for owner@example.com.',
      },
    });
    createTenantActionMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );
    await user.click(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    );

    expect(
      screen.getByRole('status', { name: 'Inviting owner…' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Inviting owner…' }),
    ).toBeDisabled();

    resolveAction({ ok: false });
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: 'Inviting owner…' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows a soft owner-invite confirmation, not a blocking error, for an unregistered owner email', async () => {
    createTenantActionMock.mockResolvedValue({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        message:
          "No account found for owner@example.com — they'll be sent an invite to sign in and manage this tenant as owner.",
      },
    });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "No account found for owner@example.com — they'll be sent an invite to sign in and manage this tenant as owner.",
      ),
    ).toBeVisible();
  });

  it('resubmits with confirmOwnerInviteToken set once the operator confirms an unchanged owner email', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        message: 'No account found for owner@example.com.',
      },
    });
    createTenantActionMock.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    await user.click(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    );

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: 'owner@example.com',
      }),
    );
  });

  it('resubmits with confirmOwnerInviteToken set when the owner email only differs from the server-normalized form by case or whitespace', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'john.doe@example.com',
        message: 'No account found for john.doe@example.com.',
      },
    });
    createTenantActionMock.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await user.type(
      screen.getByRole('textbox', { name: 'Tenant name' }),
      'Acme',
    );
    await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'acme');
    await user.type(
      screen.getByRole('textbox', { name: 'Domain' }),
      'acme.example.com',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Owner email' }),
      'John.Doe@Example.com',
    );
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    await user.click(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    );

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: 'John.Doe@Example.com',
      }),
    );
  });

  it('drops the stale confirmation and re-requires a fresh confirm once the owner email is edited', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        message: 'No account found for owner@example.com.',
      },
    });
    createTenantActionMock.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );
    await screen.findByText('No account found for owner@example.com.');

    await user.type(
      screen.getByRole('textbox', { name: 'Owner email' }),
      '.uk',
    );
    expect(
      screen.queryByText('No account found for owner@example.com.'),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /begin provisioning/i }),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: 'owner@example.com.uk',
      }),
    );
  });

  it('echoes the confirmation token back once the operator confirms an unchanged owner email', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: 'confirmation-token-for-owner-example-com',
        message: 'No account found for owner@example.com.',
      },
    });
    createTenantActionMock.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    await user.click(
      await screen.findByRole('button', { name: /confirm & invite owner/i }),
    );

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: 'owner@example.com',
        confirmOwnerInviteToken: 'confirmation-token-for-owner-example-com',
      }),
    );
  });

  it('drops the stale token along with the stale confirmation once the owner email is edited', async () => {
    createTenantActionMock.mockResolvedValueOnce({
      ok: false,
      ownerInviteConfirmation: {
        email: 'owner@example.com',
        token: 'confirmation-token-for-owner-example-com',
        message: 'No account found for owner@example.com.',
      },
    });
    createTenantActionMock.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );
    await screen.findByText('No account found for owner@example.com.');

    await user.type(
      screen.getByRole('textbox', { name: 'Owner email' }),
      '.uk',
    );
    await user.click(
      await screen.findByRole('button', { name: /begin provisioning/i }),
    );

    expect(createTenantActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ownerEmail: 'owner@example.com.uk',
        confirmOwnerInviteToken: undefined,
      }),
    );
  });

  it('shows a general error returned from the Server Action', async () => {
    createTenantActionMock.mockResolvedValue({
      ok: false,
      error: "Couldn't create the tenant — try again.",
    });
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(
      screen.getByRole('button', { name: /begin provisioning/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't create the tenant",
    );
  });
});
