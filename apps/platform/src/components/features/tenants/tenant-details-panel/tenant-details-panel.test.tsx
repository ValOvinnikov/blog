import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { useRouter as useGuardRouter } from '@platform/i18n/base-navigation';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { mockRouter } from '@platform/testing/mock-router';
import {
  makeClientTenant,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantDetailsPanel } from './tenant-details-panel';

const render = renderWithIntl;

const OWNER_EXAMPLE_COM = 'owner@example.com';

const OWNER = { email: OWNER_EXAMPLE_COM };

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

const ACME_EXAMPLE_COM = 'acme.example.com';
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
const AT_20260826_0000 = '2026-08-26T00:00:00.000Z';
const LOCKED_THIS_TENANT_IS_ARCHIVED = 'Locked — this tenant is archived.';
const SAVE_AND_LEAVE = 'Save and leave';
const NAME_FIELD = 'Name';
const APPENDED_CHARACTER = '!';
const PLAN_LABEL = 'Plan';
const FREE_OPTION = 'Free';
const GROWTH_OPTION = 'Growth';
const ENGLISH_OPTION = 'English';
const DUTCH_OPTION = 'Dutch';
const TENANTS_LINK = 'Tenants';
const ACME_INC = 'Acme Inc.';
const ACME_LTD = 'Acme Ltd';
const PROVISIONING_STARTED_MESSAGE =
  "This tenant's provisioning has already started; its details can no longer be edited.";
const OWNER_HAS_FREE_TENANT_MESSAGE =
  'This owner already has a Free site. Archive it or keep this site on its current plan.';
const OWNER_ALREADY_JOINED_MESSAGE =
  "This tenant's owner has already signed in, so their email can no longer be corrected here — this would transfer ownership instead.";
const SAVE_FAILED_MESSAGE = "Couldn't save tenant details — try again.";
const ARCHIVED_NOTICE_TEXT = 'This tenant is archived.';

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
      const tenant = makeClientTenant({
        name: ACME_INC,
        primaryDomain: ACME_EXAMPLE_COM,
        plan: TENANT_PLAN.FREE,
        locale: LOCALE_ISO_CODES.EN,
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveValue(ACME_INC);
      expect(nameInput).not.toBeDisabled();

      const domainInput = screen.getByRole('textbox', { name: PRIMARY_DOMAIN });
      expect(domainInput).toHaveValue(ACME_EXAMPLE_COM);

      const freeOption = screen.getByRole('button', { name: FREE_OPTION });
      expect(freeOption).toHaveAttribute(ARIA_PRESSED, 'true');

      const englishOption = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishOption).toHaveAttribute(ARIA_PRESSED, 'true');

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      expect(ownerEmailInput).toHaveValue(OWNER_EXAMPLE_COM);
      expect(ownerEmailInput).toHaveAttribute('type', 'email');

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toBeDisabled();
    });

    it('renders the plan field label as a plain span, not a <label htmlFor> pointing nowhere, while still exposing the accessible name via ariaLabel', () => {
      const tenant = makeClientTenant({ plan: TENANT_PLAN.FREE });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const planLabelText = screen.getByText(PLAN_LABEL);
      expect(planLabelText.tagName).toBe('SPAN');
      expect(planLabelText).not.toHaveAttribute('for');

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      expect(planGroup).toBeVisible();
    });

    it('enables Save when only the owner email is edited', async () => {
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toBeDisabled();

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);

      expect(saveButton).toBeEnabled();
    });

    it('saves the edited values and refreshes on success, sending the unchanged owner email as an ordinary field', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ name: ACME_RENAMED }),
      });
      const tenant = makeClientTenant({ id: TENANT_ID, name: ACME_INC });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            name: ACME_RENAMED,
            ownerEmail: OWNER_EXAMPLE_COM,
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
      const tenant = makeClientTenant({ id: TENANT_ID });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({ ownerEmail: NEW_OWNER_EXAMPLE_COM }),
        );
      });
    });

    it('shows a field error and does not refresh when saving fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
        },
      });
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const domainInput = screen.getByRole('textbox', { name: PRIMARY_DOMAIN });
      await user.clear(domainInput);
      await user.type(domainInput, 'taken.example.com');
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const domainError = await screen.findByText(THIS_DOMAIN_ALREADY_IN_USE);
      expect(domainError).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("associates a field's error with its input via aria-invalid and aria-describedby", async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED },
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
        },
      });
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.type(nameInput, APPENDED_CHARACTER);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);
      await screen.findByText(ENTER_A_TENANT_NAME);

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
      const tenant = makeClientTenant({ id: TENANT_ID, name: ACME_INC });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const savedToast = await screen.findByText(TENANT_DETAILS_SAVED);
      expect(savedToast).toBeVisible();

      await user.type(nameInput, ' again');
      const savedToastAfterEdit = screen.getByText(TENANT_DETAILS_SAVED);
      expect(savedToastAfterEdit).toBeVisible();
    });

    it('does not show a success alert when saving fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
        },
      });
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.type(nameInput, APPENDED_CHARACTER);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const domainError = await screen.findByText(THIS_DOMAIN_ALREADY_IN_USE);
      expect(domainError).toBeVisible();
      const savedToast = screen.queryByText(TENANT_DETAILS_SAVED);
      expect(savedToast).not.toBeInTheDocument();
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.PROVISIONING_STARTED,
      });
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.type(nameInput, APPENDED_CHARACTER);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const message = await screen.findByText(PROVISIONING_STARTED_MESSAGE);
      expect(message).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('tells the operator the owner already has a Free site, and does not refresh', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
      });
      render(
        <TenantDetailsPanel
          tenant={makeClientTenant()}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.type(nameInput, APPENDED_CHARACTER);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const message = await screen.findByText(OWNER_HAS_FREE_TENANT_MESSAGE);
      expect(message).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a distinct, non-generic message when the owner has already joined, and does not refresh', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
      });
      const tenant = makeClientTenant({ id: TENANT_ID });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      await user.clear(ownerEmailInput);
      await user.type(ownerEmailInput, NEW_OWNER_EXAMPLE_COM);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      const message = await screen.findByText(OWNER_ALREADY_JOINED_MESSAGE);
      expect(message).toBeVisible();
      const genericError = screen.queryByText(/couldn.?t save/i);
      expect(genericError).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows a field-level error on owner email when the new address already has a pending invite', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
        },
      });
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const editableOwnerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      await user.clear(editableOwnerEmailInput);
      await user.type(editableOwnerEmailInput, 'taken@example.com');
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

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
      const tenant = makeClientTenant({ primaryDomain: ACME_EXAMPLE_COM });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      expect(domainInput).toHaveValue(ACME_EXAMPLE_COM);
      expect(domainInput).toBeDisabled();
      expect(domainInput).toHaveAccessibleDescription(
        LOCKED_CONNECT_DOMAIN_STEP_HAS,
      );
    });

    it('renders every other field as editable when only one field is locked', () => {
      const tenant = makeClientTenant({
        name: ACME_INC,
        primaryDomain: ACME_EXAMPLE_COM,
        plan: TENANT_PLAN.FREE,
        locale: LOCALE_ISO_CODES.EN,
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).not.toBeDisabled();
      const freeOption = screen.getByRole('button', { name: FREE_OPTION });
      expect(freeOption).not.toBeDisabled();
      const englishOption = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishOption).not.toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
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
        name: ACME_INC,
        primaryDomain: 'taken-domain.example.com',
      });
      const nameLocked: TTenantFieldLocks = {
        name: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
      };
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={nameLocked}
          owner={OWNER}
        />,
      );

      const domainInput = screen.getByRole('textbox', { name: PRIMARY_DOMAIN });
      await user.clear(domainInput);
      await user.type(domainInput, NEW_DOMAIN_EXAMPLE_COM);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

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
      const tenant = makeClientTenant({ plan: TENANT_PLAN.GROWTH });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={{ plan: { kind: 'succeeded' } }}
          owner={OWNER}
        />,
      );

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      expect(planGroup).toHaveAttribute('data-disabled');
      expect(planGroup).toHaveAccessibleDescription(
        'Locked — provisioning has already finished.',
      );

      const growthOption = screen.getByRole('button', { name: GROWTH_OPTION });
      expect(growthOption).toBeDisabled();
      expect(growthOption).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('saves the default language chosen from the supported list', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ locale: LOCALE_ISO_CODES.NL }),
      });
      render(
        <TenantDetailsPanel
          tenant={makeClientTenant({
            id: TENANT_ID,
            locale: LOCALE_ISO_CODES.EN,
          })}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const dutchOption = screen.getByRole('button', { name: DUTCH_OPTION });
      await user.click(dutchOption);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

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
      const tenant = makeClientTenant({ id: TENANT_ID });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const editableDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      await user.clear(editableDomainInput);
      await user.type(editableDomainInput, NEW_DOMAIN_EXAMPLE_COM);
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

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
      const tenant = makeClientTenant({
        name: ACME_INC,
        primaryDomain: ACME_EXAMPLE_COM,
        plan: TENANT_PLAN.GROWTH,
        locale: LOCALE_ISO_CODES.EN,
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={ALL_LOCKED_RUNNING}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toBeDisabled();
      const domainInput = screen.getByRole('textbox', { name: PRIMARY_DOMAIN });
      expect(domainInput).toBeDisabled();
      const englishOption = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishOption).toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      expect(ownerEmailInput).toBeDisabled();
      const growthOption = screen.getByRole('button', { name: GROWTH_OPTION });
      expect(growthOption).toBeDisabled();
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('fields container', () => {
    it('exposes a group role with an accessible name, so a forced-focus landing announces something', () => {
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const fieldsGroup = screen.getByRole('group', {
        name: TENANT_DETAIL_FIELDS,
      });
      expect(fieldsGroup).toBeVisible();
    });
  });

  describe('mid-edit lock transition', () => {
    it('discards an unsaved edit and reverts to the server value when the field being edited newly locks', async () => {
      const tenant = makeClientTenant({ primaryDomain: ACME_EXAMPLE_COM });
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      await user.clear(domainInput);
      await user.type(domainInput, UNSAVED_DOMAIN_EXAMPLE_COM);
      expect(domainInput).toHaveValue(UNSAVED_DOMAIN_EXAMPLE_COM);

      rerender(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const lockedDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN,
      });
      expect(lockedDomainInput).toHaveValue(ACME_EXAMPLE_COM);
      expect(lockedDomainInput).toBeDisabled();
    });

    it('leaves an unrelated field’s unsaved edit alone when a different field newly locks', async () => {
      const tenant = makeClientTenant({ name: ACME_INC });
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED_UNSAVED);

      rerender(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const nameInputAfterLock = screen.getByRole('textbox', {
        name: NAME_FIELD,
      });
      expect(nameInputAfterLock).toHaveValue(ACME_RENAMED_UNSAVED);
    });
  });

  describe('Save button dirty-state gating', () => {
    it('is disabled when the form is pristine', () => {
      const tenant = makeClientTenant();
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toBeDisabled();
    });

    it('enables once a field is edited, and disables again once edited back to the original value', async () => {
      const tenant = makeClientTenant({ name: ACME_INC });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      expect(saveButton).toBeEnabled();

      await user.clear(nameInput);
      await user.type(nameInput, ACME_INC);
      expect(saveButton).toBeDisabled();
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
      const tenant = makeClientTenant({ id: TENANT_ID, name: ACME_INC });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const idleSaveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(idleSaveButton);

      const saveButton = await screen.findByRole('button', {
        name: 'Saving…',
      });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent('Saving…');

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
      const tenant = makeClientTenant({ id: TENANT_ID, name: ACME_INC });
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_RENAMED);
      const dirtySaveButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await user.click(dirtySaveButton);

      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      rerender(
        <TenantDetailsPanel
          tenant={makeClientTenant({ id: TENANT_ID, name: ACME_RENAMED })}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const saveButton = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('lock transition announcement', () => {
    it('announces a lock once a field newly locks', () => {
      const tenant = makeClientTenant();
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      rerender(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(liveRegion).toHaveTextContent(
        'Some tenant detail fields are now locked.',
      );
    });

    it('announces an unlock once a field becomes editable again', () => {
      const tenant = makeClientTenant();
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={DOMAIN_LOCKED}
          owner={OWNER}
        />,
      );

      const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(liveRegion).toHaveTextContent('');

      rerender(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );
      expect(liveRegion).toHaveTextContent(
        'More tenant detail fields are now editable.',
      );
    });
  });

  describe('archived tenant', () => {
    it('disables every field and the Save button, regardless of edits or field locks', async () => {
      const tenant = makeClientTenant({
        name: ACME_INC,
        deprovisionedAt: new Date(AT_20260826_0000),
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toBeDisabled();
      const domainInput = screen.getByRole('textbox', { name: PRIMARY_DOMAIN });
      expect(domainInput).toBeDisabled();
      const englishOption = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishOption).toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL,
      });
      expect(ownerEmailInput).toBeDisabled();
      const freeOption = screen.getByRole('button', { name: FREE_OPTION });
      expect(freeOption).toBeDisabled();

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toBeDisabled();

      await user.click(saveButton);
      expect(updateTenantDetailsActionMock).not.toHaveBeenCalled();
    });

    it('exposes an accessible hint for an archived field, reusing the same lock convention as a step/succeeded/running lock', () => {
      const tenant = makeClientTenant({
        deprovisionedAt: new Date(AT_20260826_0000),
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveAccessibleDescription(
        LOCKED_THIS_TENANT_IS_ARCHIVED,
      );

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      expect(planGroup).toHaveAccessibleDescription(
        LOCKED_THIS_TENANT_IS_ARCHIVED,
      );
    });

    it('describes the disabled Save button with the page-level archived notice when an archivedNoticeId is supplied', () => {
      const tenant = makeClientTenant({
        deprovisionedAt: new Date(AT_20260826_0000),
      });
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

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toHaveAccessibleDescription(ARCHIVED_NOTICE_TEXT);
    });

    it('leaves the Save button without a description when no archivedNoticeId is supplied', () => {
      const tenant = makeClientTenant({
        deprovisionedAt: new Date(AT_20260826_0000),
      });
      render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('focus management on a locking transition', () => {
    it('moves focus to the fields container when a field newly locks while focus was inside the panel', () => {
      const tenant = makeClientTenant({ name: ACME_INC });
      const { rerender } = render(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={NO_LOCKS}
          owner={OWNER}
        />,
      );

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      rerender(
        <TenantDetailsPanel
          tenant={tenant}
          fieldLocks={ALL_LOCKED_RUNNING}
          owner={OWNER}
        />,
      );

      const fieldsGroup = screen.getByRole('group', {
        name: TENANT_DETAIL_FIELDS,
      });
      expect(fieldsGroup).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });
  });

  describe('leaving with unsaved edits', () => {
    const push = vi.mocked(vi.mocked(useGuardRouter)().push);

    const renderGuardedPanel = () =>
      render(
        <>
          <TenantDetailsPanel
            tenant={makeClientTenant({ name: ACME_INC })}
            fieldLocks={NO_LOCKS}
            owner={OWNER}
          />
          <GuardedLink href="/tenants">{TENANTS_LINK}</GuardedLink>
        </>,
      );

    beforeEach(() => {
      push.mockReset();
    });

    it('navigates without asking when nothing is edited', async () => {
      renderGuardedPanel();

      const tenantsLink = screen.getByRole('link', { name: TENANTS_LINK });
      await user.click(tenantsLink);

      expect(push).toHaveBeenCalledWith('/tenants');
      const leaveDialog = screen.queryByRole('alertdialog');
      expect(leaveDialog).not.toBeInTheDocument();
    });

    it('asks first, then restores the saved values on Discard and leave', async () => {
      renderGuardedPanel();
      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_LTD);

      const tenantsLink = screen.getByRole('link', { name: TENANTS_LINK });
      await user.click(tenantsLink);

      const leaveDialog = screen.getByRole('alertdialog', {
        name: 'Leave without saving?',
      });
      expect(leaveDialog).toHaveAccessibleDescription(
        'You have 1 unsaved change on Tenant details.',
      );
      expect(push).not.toHaveBeenCalled();

      const discardButton = screen.getByRole('button', {
        name: 'Discard and leave',
      });
      await user.click(discardButton);

      expect(push).toHaveBeenCalledWith('/tenants');
      expect(nameInput).toHaveValue(ACME_INC);
    });

    it('saves the edits before leaving on Save and leave', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant(),
      });
      renderGuardedPanel();
      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_LTD);

      const tenantsLink = screen.getByRole('link', { name: TENANTS_LINK });
      await user.click(tenantsLink);
      const saveAndLeaveButton = screen.getByRole('button', {
        name: SAVE_AND_LEAVE,
      });
      await user.click(saveAndLeaveButton);

      await waitFor(() => expect(push).toHaveBeenCalledWith('/tenants'));
      expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: ACME_LTD }),
      );
    });

    it('stays on the page with the save error shown when Save and leave fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      renderGuardedPanel();
      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.clear(nameInput);
      await user.type(nameInput, ACME_LTD);

      const tenantsLink = screen.getByRole('link', { name: TENANTS_LINK });
      await user.click(tenantsLink);
      const saveAndLeaveButton = screen.getByRole('button', {
        name: SAVE_AND_LEAVE,
      });
      await user.click(saveAndLeaveButton);

      const saveError = await screen.findByText(SAVE_FAILED_MESSAGE);
      expect(saveError).toBeVisible();
      expect(push).not.toHaveBeenCalled();
      expect(nameInput).toHaveValue(ACME_LTD);
    });
  });
});
