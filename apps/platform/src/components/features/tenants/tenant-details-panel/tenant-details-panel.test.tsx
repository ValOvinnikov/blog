import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
} from '@blog/db';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { useRouter as useGuardRouter } from '@platform/i18n/base-navigation';
import en from '@platform/i18n/messages/en.json';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouter } from '@platform/testing/mock-router';
import {
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_NEW_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_RENAMED_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  mockDoneProvisioningSteps,
  MOCK_TENANT_NAME,
  OWNER_EMAIL_LABEL,
  PRIMARY_DOMAIN_LABEL,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  computeTenantFieldLocks,
  type TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
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
const ALL_LOCKED_SUCCEEDED = computeTenantFieldLocks(
  mockDoneProvisioningSteps(),
  TENANT_PROVISIONING_STATUS.READY,
);
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
const LOCK_ANNOUNCEMENT_LIVE = 'lock-announcement-live';
const ACME_LTD = 'Acme Ltd';
const NEW_DOMAIN = 'new-domain.example.com';
const TAKEN_DOMAIN = 'taken.example.com';
const UNSAVED_DOMAIN = 'unsaved-domain.example.com';
const UNSAVED_NAME = `${MOCK_RENAMED_TENANT_NAME} (unsaved)`;
const TENANTS_PATH = adminRoutes.tenants();

const t = makeEnTranslator();
const panelCopy = en.tenantDetailsPanel;
const fieldErrorCopy = en.tenantFieldErrors;

const NAME_FIELD = panelCopy.nameLabel;
const PLAN_LABEL = panelCopy.planLabel;
const FREE_OPTION = panelCopy.planOptionFree;
const GROWTH_OPTION = panelCopy.planOptionGrowth;
const ENGLISH_OPTION = en.languageNames.EN;
const DUTCH_OPTION = en.languageNames.NL;
const SAVING = panelCopy.savingButton;
const SAVE_AND_LEAVE = en.leavePageDialog.saveAndLeave;
const DISCARD_AND_LEAVE = en.leavePageDialog.discardAndLeave;
const TENANTS_LINK = en.navSections.tenants;
const LOCKED_CONNECT_DOMAIN_STEP = t(
  'tenantDetailsPanel.fieldLockedReasonStep',
  { step: en.provisioningStatusView.stepLabel.MAP_DOMAIN },
);

const FIELD_ERROR_CASES = [
  {
    title: 'taken domain',
    inputLabel: PRIMARY_DOMAIN_LABEL,
    value: TAKEN_DOMAIN,
    fieldErrors: {
      primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
    },
    message: fieldErrorCopy.domainTaken,
  },
  {
    title: 'taken owner email',
    inputLabel: OWNER_EMAIL_LABEL,
    value: MOCK_NEW_OWNER_EMAIL,
    fieldErrors: {
      ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
    },
    message: fieldErrorCopy.ownerEmailTaken,
  },
  {
    title: 'server-side domain lock',
    inputLabel: PRIMARY_DOMAIN_LABEL,
    value: NEW_DOMAIN,
    fieldErrors: {
      primaryDomain: {
        reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
        values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
      },
    },
    message: LOCKED_CONNECT_DOMAIN_STEP,
  },
];

const REFUSAL_CASES = [
  {
    reason: TENANT_REFUSAL.PROVISIONING_STARTED,
    message: panelCopy.errors.provisioningStarted,
  },
  {
    reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
    message: panelCopy.errors.ownerAlreadyJoined,
  },
  {
    reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    message: panelCopy.errors.ownerHasFreeTenant,
  },
];

const EDIT_CASES = [
  {
    title: 'name field',
    inputLabel: NAME_FIELD,
    value: MOCK_RENAMED_TENANT_NAME,
    edited: { name: MOCK_RENAMED_TENANT_NAME },
  },
  {
    title: 'owner email field',
    inputLabel: OWNER_EMAIL_LABEL,
    value: MOCK_NEW_OWNER_EMAIL,
    edited: { ownerEmail: MOCK_NEW_OWNER_EMAIL },
  },
];

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

  const replaceText = async (name: string, value: string) => {
    const input = screen.getByRole('textbox', { name });
    await user.clear(input);
    await user.type(input, value);
  };

  const clickSave = async () => {
    const saveChangesButton = screen.getByRole('button', {
      name: SAVE_CHANGES,
    });
    await user.click(saveChangesButton);
  };

  beforeEach(() => {
    user = userEvent.setup();
    updateTenantDetailsActionMock.mockReset();
    refreshMock.mockReset();
    mockRouter({ refresh: refreshMock });
  });

  describe('every field unlocked (fieldLocks={})', () => {
    it('renders every field pre-filled and editable, with Save disabled', () => {
      renderPanel({
        tenant: makeClientTenant({
          name: MOCK_TENANT_NAME,
          primaryDomain: MOCK_TENANT_DOMAIN,
          plan: TENANT_PLAN.FREE,
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
      expect(nameInput).not.toBeDisabled();

      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      const freeButton = screen.getByRole('button', { name: FREE_OPTION });
      expect(freeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      const englishButton = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
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

    it('labels the plan field with a span and exposes it as a named group', () => {
      renderPanel({ tenant: makeClientTenant({ plan: TENANT_PLAN.FREE }) });

      const planLabelText = screen.getByText(PLAN_LABEL);
      expect(planLabelText.tagName).toBe('SPAN');
      expect(planLabelText).not.toHaveAttribute('for');

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      expect(planGroup).toBeVisible();
    });

    it.each(EDIT_CASES)(
      'saves and refreshes after the $title is edited',
      async ({ inputLabel, value, edited }) => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
          tenant: makeClientTenant(),
        });
        const tenant = makeClientTenant({
          id: TENANT_ID,
          name: MOCK_TENANT_NAME,
        });
        renderPanel({ tenant });

        await replaceText(inputLabel, value);
        await clickSave();

        await waitFor(() => {
          expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
            TENANT_ID,
            detailsValuesOf(tenant, edited),
          );
        });
        await waitFor(() => expect(refreshMock).toHaveBeenCalled());
      },
    );

    it('shows a save-confirmation toast that outlives further edits', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({
          id: TENANT_ID,
          name: MOCK_RENAMED_TENANT_NAME,
        }),
      });
      renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: MOCK_TENANT_NAME }),
      });

      await replaceText(NAME_FIELD, MOCK_RENAMED_TENANT_NAME);
      await clickSave();

      const savedToast = await screen.findByText(panelCopy.alertSuccess);
      expect(savedToast).toBeVisible();

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      await user.type(nameInput, ' again');
      const savedToastAfterEdit = screen.getByText(panelCopy.alertSuccess);
      expect(savedToastAfterEdit).toBeVisible();
    });

    it.each(FIELD_ERROR_CASES)(
      'shows the $title error on its input, with no refresh or toast',
      async ({ inputLabel, value, fieldErrors, message }) => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors,
        });
        renderPanel({ tenant: makeClientTenant({ id: TENANT_ID }) });

        await replaceText(inputLabel, value);
        await clickSave();

        const invalidInput = await screen.findByRole('textbox', {
          name: inputLabel,
        });
        await waitFor(() => expect(invalidInput).toBeInvalid());
        expect(invalidInput).toHaveAccessibleDescription(message);
        const savedToast = screen.queryByText(panelCopy.alertSuccess);
        expect(savedToast).not.toBeInTheDocument();
        expect(refreshMock).not.toHaveBeenCalled();
      },
    );

    it("associates a field's error with its input via aria attributes", async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED },
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
        },
      });
      renderPanel();

      await replaceText(NAME_FIELD, ACME_LTD);
      await clickSave();
      await screen.findByText(fieldErrorCopy.nameRequired);

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription(
        fieldErrorCopy.nameRequired,
      );

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription(
        fieldErrorCopy.domainInvalid,
      );
    });

    it.each(REFUSAL_CASES)(
      'shows the $reason refusal as a form error, with no refresh',
      async ({ reason, message }) => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.REFUSED,
          reason,
        });
        renderPanel();

        await replaceText(NAME_FIELD, ACME_LTD);
        await clickSave();

        const refusalMessage = await screen.findByText(message);
        expect(refusalMessage).toBeVisible();
        const saveFailedMessage = screen.queryByText(
          panelCopy.errors.saveFailed,
        );
        expect(saveFailedMessage).not.toBeInTheDocument();
        expect(refreshMock).not.toHaveBeenCalled();
      },
    );
  });

  describe('per-field locking', () => {
    it('renders a field whose consuming step completed as disabled, stating why', () => {
      renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const domainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(domainInput).toBeDisabled();
      expect(domainInput).toHaveAccessibleDescription(
        LOCKED_CONNECT_DOMAIN_STEP,
      );
    });

    it('renders every other field as editable when only one is locked', () => {
      renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).not.toBeDisabled();
      const freeButton = screen.getByRole('button', { name: FREE_OPTION });
      expect(freeButton).not.toBeDisabled();
      const englishButton = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishButton).not.toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).not.toBeDisabled();
    });

    it('lets the operator save the unlocked field beside a locked one', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({ id: TENANT_ID, primaryDomain: NEW_DOMAIN }),
      });
      const tenant = makeClientTenant({ id: TENANT_ID });
      renderPanel({
        tenant,
        fieldLocks: {
          name: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      });

      await replaceText(PRIMARY_DOMAIN_LABEL, NEW_DOMAIN);
      await clickSave();

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { primaryDomain: NEW_DOMAIN }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('locks the plan control once provisioning has succeeded', () => {
      renderPanel({
        tenant: makeClientTenant({ plan: TENANT_PLAN.GROWTH }),
        fieldLocks: ALL_LOCKED_SUCCEEDED,
      });

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      expect(planGroup).toHaveAttribute('data-disabled');
      expect(planGroup).toHaveAccessibleDescription(
        panelCopy.fieldLockedReasonSucceeded,
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
      const tenant = makeClientTenant({
        id: TENANT_ID,
        locale: LOCALE_ISO_CODES.EN,
      });
      renderPanel({ tenant });

      const dutchButton = screen.getByRole('button', { name: DUTCH_OPTION });
      await user.click(dutchButton);
      await clickSave();

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          TENANT_ID,
          detailsValuesOf(tenant, { locale: LOCALE_ISO_CODES.NL }),
        );
      });
    });
  });

  describe('every field locked (RUNNING/SUCCEEDED)', () => {
    it('disables every control and Save, since nothing can become dirty', () => {
      renderPanel({
        tenant: makeClientTenant({ plan: TENANT_PLAN.GROWTH }),
        fieldLocks: ALL_LOCKED_RUNNING,
      });

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toBeDisabled();
      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toBeDisabled();
      const englishButton = screen.getByRole('button', {
        name: ENGLISH_OPTION,
      });
      expect(englishButton).toBeDisabled();
      const ownerEmailInput = screen.getByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).toBeDisabled();
      const growthButton = screen.getByRole('button', { name: GROWTH_OPTION });
      expect(growthButton).toBeDisabled();
      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();
    });
  });

  describe('fields container', () => {
    it('exposes a named group so a forced-focus landing announces it', () => {
      renderPanel();

      const tenantDetailFieldsGroup = screen.getByRole('group', {
        name: panelCopy.fieldsGroupLabel,
      });
      expect(tenantDetailFieldsGroup).toBeVisible();
    });
  });

  describe('mid-edit lock transition', () => {
    let rerender: ReturnType<typeof renderPanel>['rerender'];

    beforeEach(() => {
      ({ rerender } = renderPanel());
    });

    it('reverts an unsaved edit when the field being edited newly locks', async () => {
      await replaceText(PRIMARY_DOMAIN_LABEL, UNSAVED_DOMAIN);
      const primaryDomainInput = screen.getByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(primaryDomainInput).toHaveValue(UNSAVED_DOMAIN);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(primaryDomainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(primaryDomainInput).toBeDisabled();
    });

    it('keeps an unrelated field’s unsaved edit when another field locks', async () => {
      await replaceText(NAME_FIELD, UNSAVED_NAME);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveValue(UNSAVED_NAME);
    });
  });

  describe('Save button dirty-state gating', () => {
    it('enables once a field is edited and disables when edited back', async () => {
      renderPanel({ tenant: makeClientTenant({ name: MOCK_TENANT_NAME }) });

      const saveChangesButton = screen.getByRole('button', {
        name: SAVE_CHANGES,
      });
      await replaceText(NAME_FIELD, MOCK_RENAMED_TENANT_NAME);
      expect(saveChangesButton).toBeEnabled();

      await replaceText(NAME_FIELD, MOCK_TENANT_NAME);
      expect(saveChangesButton).toBeDisabled();
    });

    it('stays disabled and announces pending while a save is in flight', async () => {
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

      await replaceText(NAME_FIELD, MOCK_RENAMED_TENANT_NAME);
      await clickSave();

      const savingButton = await screen.findByRole('button', { name: SAVING });
      expect(savingButton).toBeDisabled();
      expect(savingButton).toHaveAttribute('aria-busy', 'true');
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(SAVING);

      resolveAction({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({
          id: TENANT_ID,
          name: MOCK_RENAMED_TENANT_NAME,
        }),
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('returns to disabled once the saved tenant is applied', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant({
          id: TENANT_ID,
          name: MOCK_RENAMED_TENANT_NAME,
        }),
      });
      const { rerender } = renderPanel({
        tenant: makeClientTenant({ id: TENANT_ID, name: MOCK_TENANT_NAME }),
      });

      await replaceText(NAME_FIELD, MOCK_RENAMED_TENANT_NAME);
      await clickSave();
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      rerender(
        panel({
          tenant: makeClientTenant({
            id: TENANT_ID,
            name: MOCK_RENAMED_TENANT_NAME,
          }),
        }),
      );

      const saveChangesButton = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveChangesButton).toBeDisabled();
    });
  });

  describe('lock transition announcement', () => {
    it('announces a lock once a field newly locks', () => {
      const { rerender } = renderPanel();

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      const lockAnnouncementLive = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(lockAnnouncementLive).toHaveTextContent(
        panelCopy.lockedAnnouncement,
      );
    });

    it('announces an unlock once a field becomes editable again', () => {
      const { rerender } = renderPanel({ fieldLocks: DOMAIN_LOCKED });

      const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
      expect(liveRegion).toHaveTextContent('');

      rerender(panel());
      expect(liveRegion).toHaveTextContent(panelCopy.unlockedAnnouncement);
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

      it('disables every field and the Save button', async () => {
        const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
        expect(nameInput).toBeDisabled();
        const primaryDomainInput = screen.getByRole('textbox', {
          name: PRIMARY_DOMAIN_LABEL,
        });
        expect(primaryDomainInput).toBeDisabled();
        const englishButton = screen.getByRole('button', {
          name: ENGLISH_OPTION,
        });
        expect(englishButton).toBeDisabled();
        const ownerEmailInput = screen.getByRole('textbox', {
          name: OWNER_EMAIL_LABEL,
        });
        expect(ownerEmailInput).toBeDisabled();
        const freeButton = screen.getByRole('button', { name: FREE_OPTION });
        expect(freeButton).toBeDisabled();

        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(saveButton).toBeDisabled();

        await user.click(saveButton);
        expect(updateTenantDetailsActionMock).not.toHaveBeenCalled();
      });

      it('states the archived lock as the description of each field', () => {
        const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
        expect(nameInput).toHaveAccessibleDescription(
          panelCopy.fieldLockedReasonArchived,
        );

        const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
        expect(planGroup).toHaveAccessibleDescription(
          panelCopy.fieldLockedReasonArchived,
        );
      });

      it('leaves Save without a description when no notice id is supplied', () => {
        const saveChangesButton = screen.getByRole('button', {
          name: SAVE_CHANGES,
        });
        expect(saveChangesButton).not.toHaveAttribute('aria-describedby');
      });
    });

    it('describes the disabled Save button with the page-level archived notice', () => {
      render(
        <>
          <TenantDetailsPanel
            tenant={tenant}
            fieldLocks={NO_LOCKS}
            owner={OWNER}
            archivedNoticeId={ARCHIVED_NOTICE_ID}
          />
          <p id={ARCHIVED_NOTICE_ID}>{ARCHIVED_NOTICE_TEXT}</p>
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
    it('moves focus to the fields container when a focused field newly locks', () => {
      const { rerender } = renderPanel();

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      rerender(panel({ fieldLocks: ALL_LOCKED_RUNNING }));

      const tenantDetailFieldsGroup = screen.getByRole('group', {
        name: panelCopy.fieldsGroupLabel,
      });
      expect(tenantDetailFieldsGroup).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });
  });

  describe('leaving with unsaved edits', () => {
    const push = vi.mocked(vi.mocked(useGuardRouter)().push);

    beforeEach(async () => {
      push.mockReset();
      render(
        <>
          {panel()}
          <GuardedLink href={TENANTS_PATH}>{TENANTS_LINK}</GuardedLink>
        </>,
      );
      await replaceText(NAME_FIELD, ACME_LTD);
      const tenantsLink = screen.getByRole('link', { name: TENANTS_LINK });
      await user.click(tenantsLink);
    });

    it('restores the saved values on Discard and leave', async () => {
      const discardAndLeaveButton = screen.getByRole('button', {
        name: DISCARD_AND_LEAVE,
      });
      await user.click(discardAndLeaveButton);

      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
    });

    it('saves the edits on Save and leave', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: makeClientTenant(),
      });

      const saveAndLeaveButton = screen.getByRole('button', {
        name: SAVE_AND_LEAVE,
      });
      await user.click(saveAndLeaveButton);

      await waitFor(() => expect(push).toHaveBeenCalledWith(TENANTS_PATH));
      expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
        DEFAULT_TENANT.id,
        detailsValuesOf(DEFAULT_TENANT, { name: ACME_LTD }),
      );
    });

    it('shows the save error and keeps the edit when Save and leave fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      const saveAndLeaveButton = screen.getByRole('button', {
        name: SAVE_AND_LEAVE,
      });
      await user.click(saveAndLeaveButton);

      const saveFailedMessage = await screen.findByText(
        panelCopy.errors.saveFailed,
      );
      expect(saveFailedMessage).toBeVisible();
      const nameInput = screen.getByRole('textbox', { name: NAME_FIELD });
      expect(nameInput).toHaveValue(ACME_LTD);
    });
  });
});
