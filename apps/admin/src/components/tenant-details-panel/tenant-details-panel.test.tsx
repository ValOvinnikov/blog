import messages from '@admin/i18n/messages/en.json';
import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db';
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

// Applies the same wrapper on mount and on every `rerender()` call, so the
// live region's node identity is preserved across rerenders.
const withIntl = (ui: ReactElement) => {
  return (
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      {ui}
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

vi.mock('@admin/server/tenants/update-tenant-details-action', () => ({
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

  describe('locked (isEditable=false)', () => {
    const getLockedValue = (labelText: string) => {
      const term = screen.getByText(labelText);
      expect(term.tagName).toBe('DT');
      const value = term.nextElementSibling;
      expect(value?.tagName).toBe('DD');
      return value as HTMLElement;
    };

    it('renders every field, including plan and owner email, as selectable text carrying its label — not a disabled input', () => {
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
          isEditable={false}
          ownerEmail="owner@example.com"
        />,
      );

      expect(screen.getByText('Tenant details')).toBeVisible();

      // No disabled inputs remain in the accessibility tree at all — a
      // regression to disabled TextInputs would still surface here, since
      // getByRole finds disabled controls unless they're aria-hidden.
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      const nameValue = getLockedValue('Name');
      expect(nameValue).toHaveTextContent('Acme Inc.');
      expect(nameValue.closest('dl')).toBeInTheDocument();

      expect(getLockedValue('Slug')).toHaveTextContent('acme');
      expect(getLockedValue('Primary domain')).toHaveTextContent(
        'acme.example.com',
      );
      expect(getLockedValue('Locale')).toHaveTextContent('EN');
      expect(getLockedValue('Owner email')).toHaveTextContent(
        'owner@example.com',
      );

      // The human-readable plan label, not the raw TENANT_PLAN constant.
      const planValue = getLockedValue('Plan');
      expect(planValue).toHaveTextContent('Growth');
      expect(planValue).not.toHaveTextContent('GROWTH');
    });

    it('renders no enabled editing affordances — no Save button, no editable plan control', () => {
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          isEditable={false}
          ownerEmail="owner@example.com"
        />,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('editable (isEditable=true)', () => {
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
          isEditable={true}
          ownerEmail="owner@example.com"
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toHaveValue('Acme Inc.');
      expect(nameInput).not.toBeDisabled();

      expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
      expect(
        screen.getByRole('textbox', { name: 'Primary domain' }),
      ).toHaveValue('acme.example.com');
      expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute(
        'aria-checked',
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

    it('enables Save when only the owner email is edited', async () => {
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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

    it('shows a success alert after a successful save, and clears it once editing resumes', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({ id: 'tenant-1', name: 'Acme Renamed' }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          isEditable={true}
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

      await user.type(screen.getByRole('textbox', { name: 'Name' }), ' again');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
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
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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

  describe('Save button dirty-state gating', () => {
    it('is disabled when the form is pristine', () => {
      const tenant = makeTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          isEditable={true}
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
          isEditable={true}
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
          isEditable={true}
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
            isEditable={true}
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
            isEditable={true}
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
    it('announces the lock transition once — not on mount, not on an unrelated re-render', () => {
      const tenant = makeTenant();
      const { container, rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const liveRegion = container.querySelector('[aria-live="assertive"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion).toHaveTextContent('');

      // A re-render that leaves `isEditable` unchanged (e.g. a fresh tenant
      // reference from an unrelated prop update) must not fire it.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ name: 'Acme Renamed' })}
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent('');

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={false}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'Tenant details locked while provisioning runs.',
      );

      // A further re-render still locked must not re-fire the announcement.
      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={makeTenant({ name: 'Acme Again' })}
            isEditable={false}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'Tenant details locked while provisioning runs.',
      );
    });

    it('announces the unlock transition once provisioning finishes', () => {
      const tenant = makeTenant();
      const { container, rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={false}
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
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );
      expect(liveRegion).toHaveTextContent(
        'Tenant details unlocked and editable again.',
      );
    });
  });

  describe('focus management on the lock transition', () => {
    it('does not move focus away from document.body on mount', () => {
      const tenant = makeTenant();
      rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(document.body);
    });

    it('moves focus to the locked container when the panel locks while focus was inside it', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={true}
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
            isEditable={false}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const lockedContainer = screen.getByText('Name').closest('dl');
      expect(lockedContainer).not.toBeNull();
      expect(document.activeElement).toBe(lockedContainer);
      expect(document.activeElement).not.toBe(document.body);
    });

    it('moves focus to the now-editable container when the panel unlocks while focus was inside it', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={false}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const lockedContainer = screen.getByText('Name').closest('dl');
      lockedContainer?.focus();
      expect(document.activeElement).toBe(lockedContainer);

      rerender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      const editableContainer = nameInput.closest('[tabindex="-1"]');
      expect(editableContainer).not.toBeNull();
      expect(document.activeElement).toBe(editableContainer);
      expect(document.activeElement).not.toBe(document.body);
    });

    it('does not move focus on an unrelated re-render while isEditable stays the same', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <TenantDetailsPanel
            tenant={tenant}
            isEditable={true}
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
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(nameInput);
    });

    it('does not steal focus into the locked container when the lock transition fires while focus was outside the panel', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <PanelWithOutsideControl
            tenant={tenant}
            isEditable={true}
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
            isEditable={false}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(outsideControl);
    });

    it('does not steal focus into the editable container when the unlock transition fires while focus was outside the panel', () => {
      const tenant = makeTenant({ name: 'Acme Inc.' });
      const { rerender } = rtlRender(
        withIntl(
          <PanelWithOutsideControl
            tenant={tenant}
            isEditable={false}
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
            isEditable={true}
            ownerEmail="owner@example.com"
          />,
        ),
      );

      expect(document.activeElement).toBe(outsideControl);
    });
  });
});
