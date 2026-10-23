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
  ARCHIVED_NOTICE_TEXT,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  OWNER_EMAIL_LABEL,
  PRIMARY_DOMAIN_LABEL,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  TenantDetailsPanel,
  type TTenantDetailsPanelProps,
} from './tenant-details-panel';
import type { TTenantDetailsValues } from './tenant-details-values';

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

const ARIA_PRESSED = 'aria-pressed';
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
const ACME_LTD = 'Acme Ltd';
const SAVE_AND_LEAVE = 'Save and leave';

const DEFAULT_TENANT = makeClientTenant();

const detailsValuesOf = (
  tenant: TClientTenant,
  overrides: Partial<TTenantDetailsValues> = {},
): TTenantDetailsValues => ({
  name: tenant.name,
  primaryDomain: tenant.primaryDomain,
  plan: tenant.plan,
  locale: tenant.locale,
  ownerEmail: MOCK_OWNER_EMAIL,
  ...overrides,
});

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
          name: MOCK_TENANT_NAME,
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
      expect(nameInput).not.toBeDisabled();

      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      const freeButton = screen.getByRole('button', { name: 'Free' });
      expect(freeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      const englishButton = screen.getByRole('button', { name: 'English' });
      expect(englishButton).toHaveAttribute(ARIA_PRESSED, 'true');

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).toHaveValue(MOCK_OWNER_EMAIL);
      expect(ownerEmailInput).toHaveAttribute('type', 'email');

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();
    });

    it('renders the plan field label as a plain span, not a <label htmlFor> pointing nowhere, while still exposing the accessible name via ariaLabel', () => {
      renderPanel({ tenant: makeClientTenant({ plan: TENANT_PLAN.FREE }) });

      const planLabelText = screen.getByText('Plan');
      expect(planLabelText.tagName).toBe('SPAN');
      expect(planLabelText).not.toHaveAttribute('for');

      const planGroup = screen.getByRole('group', { name: 'Plan' });
      expect(planGroup).toBeVisible();
    });

    it('enables Save when only the owner email is edited', async () => {
      renderPanel();

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);

      expect(saveChangesButton).toBeEnabled();
    });

    it('saves the edited values and refreshes on success, sending the unchanged owner email as an ordinary field', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ name: ACME_RENAMED }),
      });
      const tenant = makeClientTenant({
        id: TENANT_ID,
        name: MOCK_TENANT_NAME,
      });
      renderPanel({ tenant });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { name: ACME_RENAMED }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('submits the edited owner email value', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant(),
      });
      const tenant = makeClientTenant({ id: TENANT_ID });
      renderPanel({ tenant });

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { ownerEmail: NEW_OWNER_EXAMPLE_COM }),
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
        const primaryDomainInput = screen.getByRole('textbox', {
          name: PRIMARY_DOMAIN_LABEL,
        });
        await user.clear(primaryDomainInput);
        await user.type(primaryDomainInput, 'taken.example.com');
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveChangesButton);

        const thisDomainAlreadyInUseText = await screen.findByText(
          THIS_DOMAIN_ALREADY_IN_USE,
        );
        expect(thisDomainAlreadyInUseText).toBeVisible();
        expect(refreshMock).not.toHaveBeenCalled();
      });

      it('does not show a success alert when saving fails', async () => {
        const nameInput = screen.getByRole('textbox', { name: 'Name' });
        await user.type(nameInput, '!');
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        await user.click(saveChangesButton);

        const thisDomainAlreadyInUseText = await screen.findByText(
          THIS_DOMAIN_ALREADY_IN_USE,
        );
        expect(thisDomainAlreadyInUseText).toBeVisible();
        const savedToast = screen.queryByText(TENANT_DETAILS_SAVED);
        expect(savedToast).not.toBeInTheDocument();
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

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.type(nameInput, '!');
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);
      await screen.findByText(ENTER_A_TENANT_NAME);

      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription(ENTER_A_TENANT_NAME);

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
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
        tenant: makeClientTenant({ id: TENANT_ID, name: MOCK_TENANT_NAME }),
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const savedToast = await screen.findByText(TENANT_DETAILS_SAVED);
      expect(savedToast).toBeVisible();

      await user.type(nameInput, ' again');
      const savedToastAfterEdit = screen.getByText(TENANT_DETAILS_SAVED);
      expect(savedToastAfterEdit).toBeVisible();
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.PROVISIONING_STARTED,
      });
      renderPanel();

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.type(nameInput, '!');
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const provisioningStartedError = await screen.findByText(
        "This tenant's provisioning has already started; its details can no longer be edited.",
      );
      expect(provisioningStartedError).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a distinct, non-generic message when the owner has already joined, and does not refresh', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
      });
      renderPanel({ tenant: makeClientTenant({ id: TENANT_ID }) });

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const message = await screen.findByText(
        "This tenant's owner has already signed in, so their email can no longer be corrected here — this would transfer ownership instead.",
      );
      expect(message).toBeVisible();
      const saveFailedAlert = screen.queryByText(/couldn.?t save/i);
      expect(saveFailedAlert).not.toBeInTheDocument();
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

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, 'taken@example.com');
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const invalidOwnerEmailInput = await screen.findByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(invalidOwnerEmailInput).toBeInvalid();
      expect(invalidOwnerEmailInput).toHaveAccessibleDescription(
        'This email already has a pending invite on this tenant.',
      );
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('per-field locking', () => {
    it('renders a field whose consuming step already completed as disabled, stating why', () => {
      renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
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
          name: MOCK_TENANT_NAME,
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          locale: LOCALE_ISO_CODES.EN,
        }),
        fieldLocks: DOMAIN_LOCKED,
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).not.toBeDisabled();
      const freeButton = screen.getByRole('button', { name: 'Free' });
      expect(freeButton).not.toBeDisabled();
      const englishButton = screen.getByRole('button', { name: 'English' });
      expect(englishButton).not.toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).not.toBeDisabled();
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
        name: MOCK_TENANT_NAME,
        primaryDomain: 'taken-domain.example.com',
      });
      renderPanel({
        tenant,
        fieldLocks: {
          name: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      });

      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      await user.clear(primaryDomainInput);
      await user.type(primaryDomainInput, NEW_DOMAIN_EXAMPLE_COM);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { primaryDomain: NEW_DOMAIN_EXAMPLE_COM }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('renders the plan control locked with a "provisioning succeeded" reason once every step is DONE', () => {
      render(
        <TenantDetailsPanel
          tenant={makeClientTenant({ plan: TENANT_PLAN.GROWTH })}
          fieldLocks={{ plan: { kind: 'succeeded' } }}
          owner={OWNER}
        />,
      );

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
      const tenant = makeClientTenant({
        id: TENANT_ID,
        locale: LOCALE_ISO_CODES.EN,
      });
      renderPanel({ tenant });

      const dutchButton = screen.getByRole('button', { name: 'Dutch' });
      await user.click(dutchButton);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { locale: LOCALE_ISO_CODES.NL }),
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

      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      await user.clear(primaryDomainInput);
      await user.type(primaryDomainInput, NEW_DOMAIN_EXAMPLE_COM);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const domainInput = await screen.findByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
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
          name: MOCK_TENANT_NAME,
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.GROWTH,
          locale: LOCALE_ISO_CODES.EN,
        }),
        fieldLocks: ALL_LOCKED_RUNNING,
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toBeDisabled();
      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toBeDisabled();
      const englishButton = screen.getByRole('button', { name: 'English' });
      expect(englishButton).toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).toBeDisabled();
      const growthButton = screen.getByRole('button', { name: 'Growth' });
      expect(growthButton).toBeDisabled();
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();
    });
  });

  describe('fields container', () => {
    it('exposes a group role with an accessible name, so a forced-focus landing announces something', () => {
      renderPanel();

      const tenantDetailFieldsGroup = screen.getByRole('group', {
        name: TENANT_DETAIL_FIELDS,
      });
      expect(tenantDetailFieldsGroup).toBeVisible();
    });
  });

  describe('mid-edit lock transition', () => {
    let rerender: ReturnType<typeof renderPanel>['rerender'];

    beforeEach(() => {
      ({ rerender } = renderPanel());
    });

    it('discards an unsaved edit and reverts to the server value when the field being edited newly locks', async () => {
      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      await user.clear(domainInput);
      await user.type(domainInput, UNSAVED_DOMAIN_EXAMPLE_COM);
      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toHaveValue(UNSAVED_DOMAIN_EXAMPLE_COM);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(primaryDomainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(primaryDomainInput).toBeDisabled();
    });

    it('leaves an unrelated field’s unsaved edit alone when a different field newly locks', async () => {
      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED_UNSAVED);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(nameInput).toHaveValue(ACME_RENAMED_UNSAVED);
    });
  });

  describe('Save button dirty-state gating', () => {
    it('is disabled when the form is pristine', () => {
      renderPanel();

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();
    });

    it('enables once a field is edited, and disables again once edited back to the original value', async () => {
      renderPanel({ tenant: makeClientTenant({ name: MOCK_TENANT_NAME }) });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });

      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeEnabled();

      await user.clear(nameInput);
      await user.type(nameInput, MOCK_TENANT_NAME);
      expect(saveChangesButton).toBeDisabled();
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
        tenant: makeClientTenant({ id: TENANT_ID, name: MOCK_TENANT_NAME }),
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      const saveButton = await screen.findByRole('button', {
        name: 'Saving…',
      });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Saving…');

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
        tenant: makeClientTenant({ id: TENANT_ID, name: MOCK_TENANT_NAME }),
      });

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(saveChangesButton);

      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      rerender(
        panel({
          tenant: makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED }),
        }),
      );

      const saveChangesButtonAfterRerender = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButtonAfterRerender).toBeDisabled();
    });
  });

  describe('lock transition announcement', () => {
    it('announces a lock once a field newly locks', () => {
      const { rerender } = renderPanel();

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      const lockAnnouncementLive = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(lockAnnouncementLive).toHaveTextContent(
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
        const nameInput = screen.getByRole('textbox', { name: 'Name' });
        expect(nameInput).toBeDisabled();
        const primaryDomainInput = screen.getByRole('textbox', {
          name: PRIMARY_DOMAIN_LABEL,
        });
        expect(primaryDomainInput).toBeDisabled();
        const englishButton = screen.getByRole('button', { name: 'English' });
        expect(englishButton).toBeDisabled();
        const ownerEmailInput = screen.getByRole('textbox', {
          name: OWNER_EMAIL_LABEL,
        });
        expect(ownerEmailInput).toBeDisabled();
        const freeButton = screen.getByRole('button', { name: 'Free' });
        expect(freeButton).toBeDisabled();

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
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(saveChangesButton).not.toHaveAttribute('aria-describedby');
      });
    });

    it('describes the disabled Save button with the page-level archived notice when an archivedNoticeId is supplied', () => {
      render(
        <>
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            owner={OWNER}
            archivedNoticeId="archived-notice"
          />
          <p id="archived-notice">{ARCHIVED_NOTICE_TEXT}</p>
        </>,
      );

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toHaveAccessibleDescription(
        ARCHIVED_NOTICE_TEXT,
      );
    });
  });

  describe('focus management on a locking transition', () => {
    it('moves focus to the fields container when a field newly locks while focus was inside the panel', () => {
      const { rerender } = renderPanel();

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      rerender(panel({ fieldLocks: ALL_LOCKED_RUNNING }));

      const tenantDetailFieldsGroup = screen.getByRole('group', {
        name: TENANT_DETAIL_FIELDS,
      });
      expect(tenantDetailFieldsGroup).toHaveFocus();
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
      const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
      await user.click(tenantsLink);

      expect(push).toHaveBeenCalledWith('/tenants');
      const alertdialog = screen.queryByRole('alertdialog');
      expect(alertdialog).not.toBeInTheDocument();
    });

    describe('with an edited name', () => {
      let nameInput: HTMLElement;

      beforeEach(async () => {
        nameInput = screen.getByRole('textbox', { name: 'Name' });
        await user.clear(nameInput);
        await user.type(nameInput, ACME_LTD);
      });

      it('asks first, then restores the saved values on Discard and leave', async () => {
        const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
        await user.click(tenantsLink);

        const leaveWithoutSavingAlertdialog = screen.getByRole('alertdialog', {
          name: 'Leave without saving?',
        });
        expect(leaveWithoutSavingAlertdialog).toHaveAccessibleDescription(
          'You have 1 unsaved change on Tenant details.',
        );
        expect(push).not.toHaveBeenCalled();

        const discardAndLeaveButton = screen.getByRole('button', {
          name: 'Discard and leave',
        });
        await user.click(discardAndLeaveButton);

        expect(push).toHaveBeenCalledWith('/tenants');
        expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
      });

      it('saves the edits before leaving on Save and leave', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
          tenant: makeClientTenant(),
        });

        const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
        await user.click(tenantsLink);
        const saveAndLeaveButton = screen.getByRole('button', {
          name: SAVE_AND_LEAVE,
        });
        await user.click(saveAndLeaveButton);

        await waitFor(() => expect(push).toHaveBeenCalledWith('/tenants'));
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          DEFAULT_TENANT.id,
          detailsValuesOf(DEFAULT_TENANT, { name: ACME_LTD }),
        );
      });

      it('stays on the page with the save error shown when Save and leave fails', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        const tenantsLink = screen.getByRole('link', { name: 'Tenants' });
        await user.click(tenantsLink);
        const saveAndLeaveButton = screen.getByRole('button', {
          name: SAVE_AND_LEAVE,
        });
        await user.click(saveAndLeaveButton);

        const saveFailedMessage = await screen.findByText(
          "Couldn't save tenant details — try again.",
        );
        expect(saveFailedMessage).toBeVisible();
        expect(push).not.toHaveBeenCalled();
        expect(nameInput).toHaveValue(ACME_LTD);
      });
    });
  });
});
