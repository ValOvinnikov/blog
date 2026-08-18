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

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
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
}

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
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Owner email' })).toBeVisible();
  });

  it('defaults the plan to Free', () => {
    render(<TenantDetailsForm />);

    expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('submits the current field values to createTenantAction', async () => {
    const user = userEvent.setup();
    render(<TenantDetailsForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('radio', { name: 'Growth' }));
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

  it('shows a full-form loading overlay while the create action is pending', async () => {
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

    expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Tenant name' }).closest('[inert]'),
    ).not.toBeNull();

    resolveAction({ ok: false });
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: 'Creating…' }),
      ).not.toBeInTheDocument(),
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
