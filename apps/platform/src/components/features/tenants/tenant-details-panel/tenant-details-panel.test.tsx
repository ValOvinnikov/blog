import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db';
import { ToastProvider } from '@platform/context/toast-provider';
import messages from '@platform/i18n/messages/en.json';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import {
  TenantDetailsPanel,
  type TTenantDetailsPanelProps,
} from './tenant-details-panel';

const render = renderWithIntl;

const NO_LOCKS: TTenantFieldLocks = {};
const ALL_LOCKED_RUNNING: TTenantFieldLocks = {
  name: { kind: 'running' },
  slug: { kind: 'running' },
  primaryDomain: { kind: 'running' },
  plan: { kind: 'running' },
  locale: { kind: 'running' },
  ownerEmail: { kind: 'running' },
};
const SLUG_LOCKED: TTenantFieldLocks = {
  slug: { kind: 'step', step: TENANT_PROVISIONING_STEP.DEPLOY_STUDIO },
};

// Applies the same wrapper on mount and on every `rerender()` call, so the
// live region's node identity is preserved across rerenders.
const withIntl = (ui: ReactElement) => {
  return (
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>
  );
};

// A sibling control outside the panel entirely, standing in for an unrelated
// field or the adjacent steps list that a background poll must not steal
// focus from.
const PanelWithOutsideControl = (props: TTenantDetailsPanelProps) => {
  return (
    <>
      <button type="button">Outside control</button>
      <TenantDetailsPanel {...props} />
    </>
  );
};

const { updateTenantDetailsActionMock } = vi.hoisted(() => ({
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

describe(TenantDetailsPanel, () => {
  const refreshMock = vi.fn();

  beforeEach(() => {
    updateTenantDetailsActionMock.mockReset();
    refreshMock.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: refreshMock,
    });
  });

  describe('every field unlocked (fieldLocks={})', () => {
    it('renders every field, including owner email, as an editable, enabled control, pre-filled from props — and starts with Save disabled', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.FREE,
        locale: 'EN',
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toHaveValue('Acme Inc.');
      expect(nameInput).not.toBeDisabled();

      expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
      expect(screen.getByRole('textbox', { name: 'Slug' })).not.toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Primary domain' }),
      ).toHaveValue('acme.example.com');
      expect(screen.getByRole('button', { name: 'Free' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('textbox', { name: 'Locale' })).toHaveValue('EN');

      const ownerEmailInput = screen.getByRole('textbox', {
        name: 'Owner email',
      });
      expect(ownerEmailInput).toHaveValue('owner@example.com');
      expect(ownerEmailInput).toHaveAttribute('type', 'email');

      // Nothing has been edited yet, so Save has nothing to submit.
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    });

    it('renders the plan field label as a plain span, not a <label htmlFor> pointing nowhere, while still exposing the accessible name via ariaLabel', () => {
      const tenant = makeTenant({ plan: TENANT_PLAN.FREE });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      // SegmentedControl's root has no id a `for` could ever reference, so
      // the "Plan" label text must render as a plain span rather than a
      // <label htmlFor> — a <label for="tenant-detail-plan"> here would
      // never associate with anything and is the regression this guards.
      const planLabelText = screen.getByText('Plan');
      expect(planLabelText.tagName).toBe('SPAN');
      expect(planLabelText).not.toHaveAttribute('for');

      // The accessible name still resolves correctly — via SegmentedControl's
      // own required `ariaLabel` prop, not a label association.
      expect(screen.getByRole('group', { name: 'Plan' })).toBeVisible();
    });

    it('enables Save when only the owner email is edited', async () => {
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();

      await user.clear(screen.getByRole('textbox', { name: 'Owner email' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Owner email' }),
        'new-owner@example.com',
      );

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeEnabled();
    });

    it('saves the edited values and refreshes on success, sending the unchanged owner email as an ordinary field', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({ name: 'Acme Renamed' }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        'Acme Renamed',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            name: 'Acme Renamed',
            ownerEmail: 'owner@example.com',
          }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('submits the edited owner email value', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant(),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Owner email' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Owner email' }),
        'new-owner@example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({ ownerEmail: 'new-owner@example.com' }),
        );
      });
    });

    it('shows a field error and does not refresh when saving fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: { slug: 'This slug is already in use.' },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Slug' }));
      await user.type(screen.getByRole('textbox', { name: 'Slug' }), 'acme-2');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('This slug is already in use.'),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("associates a field's error with its input via aria-invalid and aria-describedby", async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: {
          name: 'Enter a tenant name.',
          primaryDomain: 'Enter a valid domain.',
        },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText('Enter a tenant name.');

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription('Enter a tenant name.');

      const domainInput = screen.getByRole('textbox', {
        name: 'Primary domain',
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription('Enter a valid domain.');

      // Fields with no error of their own stay valid and undescribed.
      const slugInput = screen.getByRole('textbox', { name: 'Slug' });
      expect(slugInput).not.toBeInvalid();
      expect(slugInput).toHaveAccessibleDescription('');
    });

    it('shows a save-confirmation toast after a successful save, independent of further edits', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({ id: 'tenant-1', name: 'Acme Renamed' }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        'Acme Renamed',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Tenant details saved.',
      );

      // Unlike the old inline alert (tied to `showSaveSuccess`, cleared on
      // any edit), a toast's lifecycle is independent of the form — it must
      // not disappear just because editing resumed.
      await user.type(screen.getByRole('textbox', { name: 'Name' }), ' again');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Tenant details saved.',
      );
    });

    it('does not show a success alert when saving fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: { slug: 'This slug is already in use.' },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('This slug is already in use.'),
      ).toBeVisible();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        error:
          "This tenant's provisioning has already started; its details can no longer be edited.",
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText(
          "This tenant's provisioning has already started; its details can no longer be edited.",
        ),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a distinct, non-generic message when the owner has already joined, and does not refresh', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        error:
          "This tenant's owner has already signed in, so their email can no longer be corrected here — this would transfer ownership instead.",
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Owner email' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Owner email' }),
        'new-owner@example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const message = await screen.findByText(
        "This tenant's owner has already signed in, so their email can no longer be corrected here — this would transfer ownership instead.",
      );
      expect(message).toBeVisible();
      // Distinct from the generic "couldn't save, try again" copy — it
      // never appears alongside the specific explanation.
      expect(screen.queryByText(/couldn.?t save/i)).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a field-level error on owner email when the new address already has a pending invite', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: {
          ownerEmail: 'This email already has a pending invite on this tenant.',
        },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Owner email' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Owner email' }),
        'taken@example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const ownerEmailInput = await screen.findByRole('textbox', {
        name: 'Owner email',
      });
      expect(ownerEmailInput).toBeInvalid();
      expect(ownerEmailInput).toHaveAccessibleDescription(
        'This email already has a pending invite on this tenant.',
      );
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('per-field locking', () => {
    it('renders a field whose consuming step already completed as disabled, stating why', () => {
      const tenant = makeTenant({ slug: 'acme' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={SLUG_LOCKED}
          ownerEmail="owner@example.com"
        />,
      );

      const slugInput = screen.getByRole('textbox', { name: 'Slug' });
      expect(slugInput).toHaveValue('acme');
      expect(slugInput).toBeDisabled();
      expect(slugInput).toHaveAccessibleDescription(
        'Locked — the "Deploy the content editor" step has already completed and used this value.',
      );
    });

    it('renders every other field, including the one that actually caused the failure, as editable', () => {
      // Mirrors the real 409 case: MAP_DOMAIN itself failed, so
      // primaryDomain — the field that caused the failure — stays editable
      // even though slug (an earlier, completed step) is locked.
      const tenant = makeTenant({
        name: 'Acme Inc.',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.FREE,
        locale: 'EN',
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={SLUG_LOCKED}
          ownerEmail="owner@example.com"
        />,
      );

      expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Primary domain' }),
      ).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Free' })).not.toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Locale' }),
      ).not.toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Owner email' }),
      ).not.toBeDisabled();
    });

    it('lets the operator correct the unlocked field that caused the failure and save it', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({
          id: 'tenant-1',
          primaryDomain: 'new-domain.example.com',
        }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({
        id: 'tenant-1',
        primaryDomain: 'taken-domain.example.com',
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={SLUG_LOCKED}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Primary domain' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Primary domain' }),
        'new-domain.example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            primaryDomain: 'new-domain.example.com',
            // The locked field's original value is submitted unchanged.
            slug: tenant.slug,
          }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('renders the plan control locked with a "provisioning succeeded" reason once every step is DONE', () => {
      const tenant = makeTenant({ plan: TENANT_PLAN.GROWTH });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={{ plan: { kind: 'succeeded' } }}
          ownerEmail="owner@example.com"
        />,
      );

      const planGroup = screen.getByRole('group', { name: 'Plan' });
      expect(planGroup).toHaveAttribute('data-disabled');
      expect(planGroup).toHaveAccessibleDescription(
        'Locked — provisioning has already finished.',
      );

      const growthOption = screen.getByRole('button', { name: 'Growth' });
      expect(growthOption).toBeDisabled();
      expect(growthOption).toHaveAttribute('aria-pressed', 'true');
    });

    it('surfaces a mismatched server-side lock as a field error on the still-enabled input', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: {
          primaryDomain:
            'Locked — the "Connect the custom domain" step has already completed and used this value.',
        },
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Primary domain' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Primary domain' }),
        'new-domain.example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      const domainInput = await screen.findByRole('textbox', {
        name: 'Primary domain',
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription(
        'Locked — the "Connect the custom domain" step has already completed and used this value.',
      );
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('every field locked (RUNNING/SUCCEEDED)', () => {
    it('disables every control and disables Save, since nothing can become dirty', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.GROWTH,
        locale: 'EN',
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={ALL_LOCKED_RUNNING}
          ownerEmail="owner@example.com"
        />,
      );

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
      expect(screen.getByRole('textbox', { name: 'Slug' })).toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Primary domain' }),
      ).toBeDisabled();
      expect(screen.getByRole('textbox', { name: 'Locale' })).toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: 'Owner email' }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Growth' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    });
  });

  describe('fields container', () => {
    it('exposes a group role with an accessible name, so a forced-focus landing announces something', () => {
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      expect(
        screen.getByRole('group', { name: 'Tenant detail fields' }),
      ).toBeInTheDocument();
    });
  });

  describe('mid-edit lock transition', () => {
    it('discards an unsaved edit and reverts to the server value when the field being edited newly locks', async () => {
      const user = userEvent.setup();
      const tenant = makeTenant({ slug: 'acme' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const slugInput = screen.getByRole('textbox', { name: 'Slug' });
      await user.clear(slugInput);
      await user.type(slugInput, 'acme-unsaved-edit');
      expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue(
        'acme-unsaved-edit',
      );

      // A background poll discovers DEPLOY_STUDIO has completed, locking
      // slug — while the operator's unsaved edit above is still showing.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
      expect(screen.getByRole('textbox', { name: 'Slug' })).toBeDisabled();
    });

    it('leaves an unrelated field’s unsaved edit alone when a different field newly locks', async () => {
      const user = userEvent.setup();
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, 'Acme Renamed (unsaved)');

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Acme Renamed (unsaved)',
      );
    });
  });

  describe('Save button dirty-state gating', () => {
    it('is disabled when the form is pristine', () => {
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    });

    it('enables once a field is edited, and disables again once edited back to the original value', async () => {
      const user = userEvent.setup();
      const tenant = makeTenant({ name: 'Acme Inc.' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });

      await user.clear(nameInput);
      await user.type(nameInput, 'Acme Renamed');
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeEnabled();

      await user.clear(nameInput);
      await user.type(nameInput, 'Acme Inc.');
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    });

    it('stays disabled while a save is in flight, even with dirty values', async () => {
      let resolveAction: (value: {
        ok: true;
        tenant: ReturnType<typeof makeTenant>;
      }) => void = () => {};
      updateTenantDetailsActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          ownerEmail="owner@example.com"
        />,
      );

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        'Acme Renamed',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByRole('button', { name: 'Saving…' }),
      ).toBeDisabled();

      resolveAction({
        ok: true,
        tenant: makeTenant({ id: 'tenant-1', name: 'Acme Renamed' }),
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('returns to disabled after a successful save applies the refreshed tenant', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({ id: 'tenant-1', name: 'Acme Renamed' }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        'Acme Renamed',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      // Stands in for `router.refresh()` causing the parent Server Component
      // to re-fetch and pass down the now-persisted tenant.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ id: 'tenant-1', name: 'Acme Renamed' })}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(
        await screen.findByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
    });
  });

  describe('lock transition announcement', () => {
    it('announces a lock once a field newly locks — not on mount, not on an unrelated re-render', () => {
      const tenant = makeTenant();
      const { container, rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion).toHaveTextContent('');

      // A re-render that leaves the locked field set unchanged (e.g. a
      // fresh tenant reference from an unrelated prop update) must not fire
      // it.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ name: 'Acme Renamed' })}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent('');

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'Some tenant detail fields are now locked.',
      );

      // A further re-render with the same locked set must not re-fire it.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ name: 'Acme Again' })}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'Some tenant detail fields are now locked.',
      );
    });

    it('announces an unlock once a field becomes editable again', () => {
      const tenant = makeTenant();
      const { container, rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toHaveTextContent('');

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'More tenant detail fields are now editable.',
      );
    });

    it('announces a lock, not nothing, when a same-count swap changes which field is locked', () => {
      const NAME_LOCKED: TTenantFieldLocks = {
        name: { kind: 'step', step: TENANT_PROVISIONING_STEP.SANITY_PROJECT },
      };
      const tenant = makeTenant();
      const { container, rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={SLUG_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toHaveTextContent('');

      // slug unlocks as name locks, in the same render — the locked-field
      // count stays 1, but the set genuinely changed.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NAME_LOCKED}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(liveRegion).toHaveTextContent(
        'Some tenant detail fields are now locked.',
      );
    });
  });

  describe('focus management on a locking transition', () => {
    it('does not move focus away from document.body on mount', () => {
      const tenant = makeTenant();
      rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(document.body);
    });

    it('moves focus to the fields container when a field newly locks while focus was inside the panel', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={ALL_LOCKED_RUNNING}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const fieldsContainer = screen
        .getByRole('textbox', { name: 'Name' })
        .closest('[tabindex="-1"]');
      expect(fieldsContainer).not.toBeNull();
      expect(document.activeElement).toBe(fieldsContainer);
      expect(document.activeElement).not.toBe(document.body);
    });

    it('does not steal focus when a locking transition fires while focus was outside the panel', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <PanelWithOutsideControl
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const outsideControl = screen.getByRole('button', {
        name: 'Outside control',
      });
      outsideControl.focus();
      expect(document.activeElement).toBe(outsideControl);

      rerender(
        withIntl(
          <PanelWithOutsideControl
            tenant={tenant}
            fieldLocks={ALL_LOCKED_RUNNING}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(outsideControl);
    });

    it('does not move focus on an unrelated re-render while the locked field set stays the same', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ name: 'Acme Renamed' })}
            fieldLocks={NO_LOCKS}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(nameInput);
    });
  });
});
