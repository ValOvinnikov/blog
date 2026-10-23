import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { useRouter as useGuardRouter } from '@platform/i18n/base-navigation';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { mockRouter } from '@platform/testing/mock-router';
import {
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_DOMAIN,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  TenantDetailsPanel,
  type TTenantDetailsPanelProps,
} from './tenant-details-panel';

const render = renderWithIntl;

const OWNER = { email: MOCK_OWNER_EMAIL };

const NO_LOCKS: TTenantFieldLocks = {};
const ALL_LOCKED_RUNNING: TTenantFieldLocks = {
  name: { kind: 'running' },
  primaryDomain: { kind: 'running' },
  plan: { kind: 'running' },
  locale: { kind: 'running' },
  ownerEmail: { kind: 'running' },
};
const DOMAIN_LOCKED: TTenantFieldLocks = {
  primaryDomain: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
};

const { updateTenantDetailsActionMock } = vi.hoisted(() => ({
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/i18n/base-navigation');

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

const PRIMARY_DOMAIN = 'Primary domain';
const ARIA_PRESSED = 'aria-pressed';
const OWNER_EMAIL = 'Owner email';
const SAVE_CHANGES = 'Save changes';
const NEW_OWNER_EXAMPLE_COM = 'new-owner@example.com';
const ACME_RENAMED = 'Acme Renamed';
const THIS_DOMAIN_ALREADY_IN_USE = 'This domain is already in use.';
const ENTER_A_TENANT_NAME = 'Enter a tenant name.';
const TENANT_DETAILS_SAVED = 'Tenant details saved.';
const LOCKED_CONNECT_DOMAIN_STEP_HAS =
  'Locked — the "Connect domain" step has already completed and used this value.';
const NEW_DOMAIN_EXAMPLE_COM = 'new-domain.example.com';
const TENANT_DETAIL_FIELDS = 'Tenant detail fields';
const UNSAVED_DOMAIN_EXAMPLE_COM = 'unsaved-domain.example.com';
const ACME_RENAMED_UNSAVED = 'Acme Renamed (unsaved)';
const LOCK_ANNOUNCEMENT_LIVE = 'lock-announcement-live';
const LOCKED_THIS_TENANT_IS_ARCHIVED = 'Locked — this tenant is archived.';
const SAVE_AND_LEAVE = 'Save and leave';

const DEFAULT_TENANT = makeClientTenant();

const panel = (props: Partial<TTenantDetailsPanelProps> = {}) => (
  <TenantDetailsPanel
    tenant={DEFAULT_TENANT}
    fieldLocks={NO_LOCKS}
    owner={OWNER}
    {...props}
  />
);

const renderPanel = (props?: Partial<TTenantDetailsPanelProps>) =>
  render(panel(props));

describe(`<${TenantDetailsPanel.name}/>`, () => {
  const refreshMock = vi.fn();
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    updateTenantDetailsActionMock.mockReset();
    refreshMock.mockReset();
    mockRouter({ refresh: refreshMock });
  });

  describe('every field unlocked (fieldLocks={})', () => {
    it('renders every field, including owner email, as an editable, enabled control, pre-filled from props — and starts with Save disabled', () => {
      renderPanel({
        tenant: makeClientTenant({
          name: 'Acme Inc.',
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toHaveValue('Acme Inc.');
      expect(nameInput).not.toBeDisabled();

      expect(screen.getByRole('textbox', { name: PRIMARY_DOMAIN })).toHaveValue(
        MOCK_TENANT_DOMAIN,
      );
      expect(screen.getByRole('button', { name: 'Free' })).toHaveAttribute(
        ARIA_PRESSED,
        'true',
      );
      expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
        ARIA_PRESSED,
        'true',
      );

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      expect(ownerEmailInput).toHaveValue(MOCK_OWNER_EMAIL);
      expect(ownerEmailInput).toHaveAttribute('type', 'email');

      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeDisabled();
    });

    it('renders the plan field label as a plain span, not a <label htmlFor> pointing nowhere, while still exposing the accessible name via ariaLabel', () => {
      renderPanel({ tenant: makeClientTenant({ plan: TENANT_PLAN.FREE }) });

      const planLabelText = screen.getByText('Plan');
      expect(planLabelText.tagName).toBe('SPAN');
      expect(planLabelText).not.toHaveAttribute('for');

      expect(screen.getByRole('group', { name: 'Plan' })).toBeVisible();
    });

    it('enables Save when only the owner email is edited', async () => {
      renderPanel();

      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeDisabled();

      await user.clear(screen.getByRole('textbox', { name: OWNER_EMAIL }));
      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        NEW_OWNER_EXAMPLE_COM,
      );

      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeEnabled();
    });

    it('saves the edited values and refreshes on success, sending the unchanged owner email as an ordinary field', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ name: ACME_RENAMED }),
      });
      renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: 'Acme Inc.' }),
      });

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        ACME_RENAMED,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            name: ACME_RENAMED,
            ownerEmail: MOCK_OWNER_EMAIL,
          }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('submits the edited owner email value', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant(),
      });
      renderPanel({ tenant: makeClientTenant({ id: TENANT_ID }) });

      await user.clear(screen.getByRole('textbox', { name: OWNER_EMAIL }));
      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        NEW_OWNER_EXAMPLE_COM,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({ ownerEmail: NEW_OWNER_EXAMPLE_COM }),
        );
      });
    });

    describe('when the domain is already taken', () => {
      beforeEach(() => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
          },
        });
        renderPanel();
      });

      it('shows a field error and does not refresh when saving fails', async () => {
        await user.clear(screen.getByRole('textbox', { name: PRIMARY_DOMAIN }));
        await user.type(
          screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
          'taken.example.com',
        );
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

        expect(
          await screen.findByText(THIS_DOMAIN_ALREADY_IN_USE),
        ).toBeVisible();
        expect(refreshMock).not.toHaveBeenCalled();
      });

      it('does not show a success alert when saving fails', async () => {
        await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
        await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

        expect(
          await screen.findByText(THIS_DOMAIN_ALREADY_IN_USE),
        ).toBeVisible();
        expect(
          screen.queryByText(TENANT_DETAILS_SAVED),
        ).not.toBeInTheDocument();
      });
    });

    it("associates a field's error with its input via aria-invalid and aria-describedby", async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED },
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
        },
      });
      renderPanel();

      await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));
      await screen.findByText(ENTER_A_TENANT_NAME);

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription(ENTER_A_TENANT_NAME);

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription('Enter a valid domain.');
    });

    it('shows a save-confirmation toast after a successful save, independent of further edits', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED }),
      });
      renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: 'Acme Inc.' }),
      });

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        ACME_RENAMED,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(await screen.findByText(TENANT_DETAILS_SAVED)).toBeVisible();

      await user.type(screen.getByRole('textbox', { name: 'Name' }), ' again');
      expect(screen.getByText(TENANT_DETAILS_SAVED)).toBeVisible();
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.PROVISIONING_STARTED,
      });
      renderPanel();

      await user.type(screen.getByRole('textbox', { name: 'Name' }), '!');
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      expect(
        await screen.findByText(
          "This tenant's provisioning has already started; its details can no longer be edited.",
        ),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a distinct, non-generic message when the owner has already joined, and does not refresh', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
      });
      renderPanel({ tenant: makeClientTenant({ id: TENANT_ID }) });

      await user.clear(screen.getByRole('textbox', { name: OWNER_EMAIL }));
      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        NEW_OWNER_EXAMPLE_COM,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      const message = await screen.findByText(
        "This tenant's owner has already signed in, so their email can no longer be corrected here — this would transfer ownership instead.",
      );
      expect(message).toBeVisible();
      expect(screen.queryByText(/couldn.?t save/i)).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a field-level error on owner email when the new address already has a pending invite', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
        },
      });
      renderPanel();

      await user.clear(screen.getByRole('textbox', { name: OWNER_EMAIL }));
      await user.type(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
        'taken@example.com',
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      const ownerEmailInput = await screen.findByRole('textbox', {
        name: OWNER_EMAIL,
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
      renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(domainInput).toBeDisabled();
      expect(domainInput).toHaveAccessibleDescription(
        LOCKED_CONNECT_DOMAIN_STEP_HAS,
      );
    });

    it('renders every other field as editable when only one field is locked', () => {
      renderPanel({
        tenant: makeClientTenant({
          name: 'Acme Inc.',
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          locale: LOCALE_ISO_CODES.EN,
        }),
        fieldLocks: DOMAIN_LOCKED,
      });

      expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Free' })).not.toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'English' }),
      ).not.toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: OWNER_EMAIL }),
      ).not.toBeDisabled();
    });

    it('lets the operator correct the unlocked field that caused the failure and save it', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({
          id: TENANT_ID,
          primaryDomain: NEW_DOMAIN_EXAMPLE_COM,
        }),
      });
      const tenant = makeClientTenant({
        id: TENANT_ID,
        name: 'Acme Inc.',
        primaryDomain: 'taken-domain.example.com',
      });
      renderPanel({
        tenant,
        fieldLocks: {
          name: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      });

      await user.clear(screen.getByRole('textbox', { name: PRIMARY_DOMAIN }));
      await user.type(
        screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
        NEW_DOMAIN_EXAMPLE_COM,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            primaryDomain: NEW_DOMAIN_EXAMPLE_COM,
            name: tenant.name,
          }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('renders the plan control locked with a "provisioning succeeded" reason once every step is DONE', () => {
      renderPanel({
        tenant: makeClientTenant({ plan: TENANT_PLAN.GROWTH }),
        fieldLocks: { plan: { kind: 'succeeded' } },
      });

      const planGroup = screen.getByRole('group', { name: 'Plan' });
      expect(planGroup).toHaveAttribute('data-disabled');
      expect(planGroup).toHaveAccessibleDescription(
        'Locked — provisioning has already finished.',
      );

      const growthOption = screen.getByRole('button', { name: 'Growth' });
      expect(growthOption).toBeDisabled();
      expect(growthOption).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('saves the default language chosen from the supported list', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ locale: LOCALE_ISO_CODES.NL }),
      });
      renderPanel({
        tenant: makeClientTenant({
          id: TENANT_ID,
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      await user.click(screen.getByRole('button', { name: 'Dutch' }));
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({ locale: LOCALE_ISO_CODES.NL }),
        );
      });
    });

    it('surfaces a mismatched server-side lock as a field error on the still-enabled input', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: {
            reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
            values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
          },
        },
      });
      renderPanel({ tenant: makeClientTenant({ id: TENANT_ID }) });

      await user.clear(screen.getByRole('textbox', { name: PRIMARY_DOMAIN }));
      await user.type(
        screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
        NEW_DOMAIN_EXAMPLE_COM,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      const domainInput = await screen.findByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription(
        LOCKED_CONNECT_DOMAIN_STEP_HAS,
      );
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('every field locked (RUNNING/SUCCEEDED)', () => {
    it('disables every control and disables Save, since nothing can become dirty', () => {
      renderPanel({
        tenant: makeClientTenant({
          name: 'Acme Inc.',
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.GROWTH,
          locale: LOCALE_ISO_CODES.EN,
        }),
        fieldLocks: ALL_LOCKED_RUNNING,
      });

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
      expect(
        screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'English' })).toBeDisabled();
      expect(screen.getByRole('textbox', { name: OWNER_EMAIL })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Growth' })).toBeDisabled();
      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeDisabled();
    });
  });

  describe('fields container', () => {
    it('exposes a group role with an accessible name, so a forced-focus landing announces something', () => {
      renderPanel();

      expect(
        screen.getByRole('group', { name: TENANT_DETAIL_FIELDS }),
      ).toBeVisible();
    });
  });

  describe('mid-edit lock transition', () => {
    let rerender: ReturnType<typeof renderPanel>['rerender'];

    beforeEach(() => {
      ({ rerender } = renderPanel());
    });

    it('discards an unsaved edit and reverts to the server value when the field being edited newly locks', async () => {
      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      await user.clear(domainInput);
      await user.type(domainInput, UNSAVED_DOMAIN_EXAMPLE_COM);
      expect(screen.getByRole('textbox', { name: PRIMARY_DOMAIN })).toHaveValue(
        UNSAVED_DOMAIN_EXAMPLE_COM,
      );

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(screen.getByRole('textbox', { name: PRIMARY_DOMAIN })).toHaveValue(
        MOCK_TENANT_DOMAIN,
      );
      expect(
        screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
      ).toBeDisabled();
    });

    it('leaves an unrelated field’s unsaved edit alone when a different field newly locks', async () => {
      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED_UNSAVED);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        ACME_RENAMED_UNSAVED,
      );
    });
  });

  describe('Save button dirty-state gating', () => {
    it('is disabled when the form is pristine', () => {
      renderPanel();

      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeDisabled();
    });

    it('enables once a field is edited, and disables again once edited back to the original value', async () => {
      renderPanel({ tenant: makeClientTenant({ name: 'Acme Inc.' }) });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });

      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeEnabled();

      await user.clear(nameInput);
      await user.type(nameInput, 'Acme Inc.');
      expect(screen.getByRole('button', { name: SAVE_CHANGES })).toBeDisabled();
    });

    it('stays disabled and announces the pending state to assistive tech while a save is in flight, even with dirty values', async () => {
      let resolveAction: (value: {
        outcome: typeof ACTION_OUTCOME.SUCCESS;
        tenant: ReturnType<typeof makeClientTenant>;
      }) => void = () => {};
      updateTenantDetailsActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: 'Acme Inc.' }),
      });

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        ACME_RENAMED,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      const saveButton = await screen.findByRole('button', {
        name: 'Saving…',
      });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toHaveTextContent('Saving…');

      resolveAction({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED }),
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('returns to disabled after a successful save applies the refreshed tenant', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED }),
      });
      const { rerender } = renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: 'Acme Inc.' }),
      });

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        ACME_RENAMED,
      );
      await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      rerender(
        panel({
          tenant: makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED }),
        }),
      );

      expect(
        await screen.findByRole('button', { name: SAVE_CHANGES }),
      ).toBeDisabled();
    });
  });

  describe('lock transition announcement', () => {
    it('announces a lock once a field newly locks', () => {
      const { rerender } = renderPanel();

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE)).toHaveTextContent(
        'Some tenant detail fields are now locked.',
      );
    });

    it('announces an unlock once a field becomes editable again', () => {
      const { rerender } = renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(liveRegion).toHaveTextContent('');

      rerender(panel());
      expect(liveRegion).toHaveTextContent(
        'More tenant detail fields are now editable.',
      );
    });
  });

  describe('archived tenant', () => {
    let tenant: TClientTenant;

    beforeEach(() => {
      tenant = makeClientTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });
    });

    describe('on its own', () => {
      beforeEach(() => {
        renderPanel({ tenant });
      });

      it('disables every field and the Save button, regardless of edits or field locks', async () => {
        expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
        expect(
          screen.getByRole('textbox', { name: PRIMARY_DOMAIN }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'English' })).toBeDisabled();
        expect(
          screen.getByRole('textbox', { name: OWNER_EMAIL }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Free' })).toBeDisabled();

        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(saveButton).toBeDisabled();

        await user.click(saveButton);
        expect(updateTenantDetailsActionMock).not.toHaveBeenCalled();
      });

      it('exposes an accessible hint for an archived field, reusing the same lock convention as a step/succeeded/running lock', () => {
        const nameInput = screen.getByRole('textbox', { name: 'Name' });
        expect(nameInput).toHaveAccessibleDescription(
          LOCKED_THIS_TENANT_IS_ARCHIVED,
        );

        const planGroup = screen.getByRole('group', { name: 'Plan' });
        expect(planGroup).toHaveAccessibleDescription(
          LOCKED_THIS_TENANT_IS_ARCHIVED,
        );
      });

      it('leaves the Save button without a description when no archivedNoticeId is supplied', () => {
        expect(
          screen.getByRole('button', { name: SAVE_CHANGES }),
        ).not.toHaveAttribute('aria-describedby');
      });
    });

    it('describes the disabled Save button with the page-level archived notice when an archivedNoticeId is supplied', () => {
      render(
        <>
          {panel({ tenant, archivedNoticeId: 'archived-notice' })}
          <p id="archived-notice">This tenant is archived.</p>
        </>,
      );

      expect(
        screen.getByRole('button', { name: SAVE_CHANGES }),
      ).toHaveAccessibleDescription('This tenant is archived.');
    });
  });

  describe('focus management on a locking transition', () => {
    it('moves focus to the fields container when a field newly locks while focus was inside the panel', () => {
      const { rerender } = renderPanel();

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      rerender(panel({ fieldLocks: ALL_LOCKED_RUNNING }));

      expect(
        screen.getByRole('group', { name: TENANT_DETAIL_FIELDS }),
      ).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });
  });

  describe('leaving with unsaved edits', () => {
    const push = vi.mocked(vi.mocked(useGuardRouter)().push);

    beforeEach(() => {
      push.mockReset();
      render(
        <>
          {panel()}
          <GuardedLink href="/tenants">Tenants</GuardedLink>
        </>,
      );
    });

    it('navigates without asking when nothing is edited', async () => {
      await user.click(screen.getByRole('link', { name: 'Tenants' }));

      expect(push).toHaveBeenCalledWith('/tenants');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    describe('with an edited name', () => {
      let nameInput: HTMLElement;

      beforeEach(async () => {
        nameInput = screen.getByRole('textbox', { name: 'Name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Acme Ltd');
      });

      it('asks first, then restores the saved values on Discard and leave', async () => {
        await user.click(screen.getByRole('link', { name: 'Tenants' }));

        expect(
          screen.getByRole('alertdialog', { name: 'Leave without saving?' }),
        ).toHaveAccessibleDescription(
          'You have 1 unsaved change on Tenant details.',
        );
        expect(push).not.toHaveBeenCalled();

        await user.click(
          screen.getByRole('button', { name: 'Discard and leave' }),
        );

        expect(push).toHaveBeenCalledWith('/tenants');
        expect(nameInput).toHaveValue('Acme Inc.');
      });

      it('saves the edits before leaving on Save and leave', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
          tenant: makeClientTenant(),
        });

        await user.click(screen.getByRole('link', { name: 'Tenants' }));
        await user.click(screen.getByRole('button', { name: SAVE_AND_LEAVE }));

        await waitFor(() => expect(push).toHaveBeenCalledWith('/tenants'));
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ name: 'Acme Ltd' }),
        );
      });

      it('stays on the page with the save error shown when Save and leave fails', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        await user.click(screen.getByRole('link', { name: 'Tenants' }));
        await user.click(screen.getByRole('button', { name: SAVE_AND_LEAVE }));

        expect(
          await screen.findByText("Couldn't save tenant details — try again."),
        ).toBeVisible();
        expect(push).not.toHaveBeenCalled();
        expect(nameInput).toHaveValue('Acme Ltd');
      });
    });
  });
});
