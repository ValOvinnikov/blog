import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db';
import { faker } from '@faker-js/faker';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { useRouter as useGuardRouter } from '@platform/i18n/base-navigation';
import messages from '@platform/i18n/messages/en.json';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  customRender,
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  mockClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_NEW_OWNER_EMAIL,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OWNER_EMAIL,
  MOCK_RENAMED_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  OWNER_EMAIL_LABEL,
  PRIMARY_DOMAIN_LABEL,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  TenantDetailsPanel,
  type TTenantDetailsPanelProps,
} from './tenant-details-panel';
import type { TTenantDetailsValues } from './tenant-details-values';

faker.seed(5994);

const { updateTenantDetailsActionMock } = vi.hoisted(() => ({
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/i18n/base-navigation');

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

const {
  tenantDetailsPanel,
  tenantFieldErrors,
  languageNames,
  navSections,
  provisioningStatusView,
  leavePageDialog,
} = messages;
const t = makeEnTranslator();

const ARIA_PRESSED = 'aria-pressed';
const LOCK_ANNOUNCEMENT_LIVE = 'lock-announcement-live';
const NAME_LABEL = tenantDetailsPanel.nameLabel;
const PLAN_LABEL = tenantDetailsPanel.planLabel;
const FREE_LABEL = tenantDetailsPanel.planOptionFree;
const GROWTH_LABEL = tenantDetailsPanel.planOptionGrowth;
const SAVING_LABEL = tenantDetailsPanel.savingButton;
const ENGLISH_LABEL = languageNames[LOCALE_ISO_CODES.EN];
const DUTCH_LABEL = languageNames[LOCALE_ISO_CODES.NL];
const TENANTS_LABEL = navSections.tenants;
const MOCK_DOMAIN_LOCKED_HINT = t('tenantDetailsPanel.fieldLockedReasonStep', {
  step: provisioningStatusView.stepLabel[TENANT_PROVISIONING_STEP.MAP_DOMAIN],
});
const MOCK_NEW_DOMAIN = faker.internet.domainName();
const MOCK_UNSAVED_DOMAIN = faker.internet.domainName();
const MOCK_UNSAVED_NAME = faker.company.name();
const MOCK_EDITED_NAME = faker.company.name();

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

const DEFAULT_TENANT = mockClientTenant();
const DEFAULT_PROPS: TTenantDetailsPanelProps = {
  tenant: DEFAULT_TENANT,
  fieldLocks: NO_LOCKS,
  owner: mockJoinedOwner(),
};

const REFUSAL_CASES = [
  {
    reason: TENANT_REFUSAL.PROVISIONING_STARTED,
    message: tenantDetailsPanel.errors.provisioningStarted,
  },
  {
    reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
    message: tenantDetailsPanel.errors.ownerAlreadyJoined,
  },
  {
    reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    message: tenantDetailsPanel.errors.ownerHasFreeTenant,
  },
];

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
  <TenantDetailsPanel {...DEFAULT_PROPS} {...props} />
);

const setup = customRender(TenantDetailsPanel, DEFAULT_PROPS);

const getNameInput = () => screen.getByRole('textbox', { name: NAME_LABEL });
const getDomainInput = () =>
  screen.getByRole('textbox', { name: PRIMARY_DOMAIN_LABEL });
const getOwnerEmailInput = () =>
  screen.getByRole('textbox', { name: OWNER_EMAIL_LABEL });
const getSaveButton = () => screen.getByRole('button', { name: SAVE_CHANGES });

describe(`<${TenantDetailsPanel.name}/>`, () => {
  let refreshMock: ReturnType<typeof mockRouterRefresh>;
  let user: UserEvent;

  const replaceValue = async (input: HTMLElement, value: string) => {
    await user.clear(input);
    await user.type(input, value);
  };

  const saveWithOwnerEmail = async (ownerEmail: string) => {
    await replaceValue(getOwnerEmailInput(), ownerEmail);
    await user.click(getSaveButton());
  };

  beforeEach(() => {
    user = userEvent.setup();
    updateTenantDetailsActionMock.mockReset();
    refreshMock = mockRouterRefresh();
  });

  describe('with every field unlocked', () => {
    it('pre-fills every field from props and starts with Save disabled', () => {
      setup();

      const nameInput = getNameInput();
      const domainInput = getDomainInput();
      const ownerEmailInput = getOwnerEmailInput();
      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      const freeButton = screen.getByRole('button', { name: FREE_LABEL });
      const englishButton = screen.getByRole('button', { name: ENGLISH_LABEL });
      const saveButton = getSaveButton();

      expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
      expect(nameInput).toBeEnabled();
      expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(ownerEmailInput).toHaveValue(MOCK_OWNER_EMAIL);
      expect(ownerEmailInput).toHaveAttribute('type', 'email');
      expect(planGroup).toBeVisible();
      expect(freeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(englishButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(saveButton).toBeDisabled();
    });

    it('exposes the fields as a named group', () => {
      setup();

      const fieldsGroup = screen.getByRole('group', {
        name: tenantDetailsPanel.fieldsGroupLabel,
      });

      expect(fieldsGroup).toBeVisible();
    });

    it('saves the edited values and refreshes on success', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
      });
      setup();

      await replaceValue(getNameInput(), MOCK_RENAMED_TENANT_NAME);
      await user.click(getSaveButton());

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          detailsValuesOf(DEFAULT_TENANT, { name: MOCK_RENAMED_TENANT_NAME }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('submits the edited owner email', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: DEFAULT_TENANT,
      });
      setup();

      await saveWithOwnerEmail(MOCK_NEW_OWNER_EMAIL);

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          detailsValuesOf(DEFAULT_TENANT, { ownerEmail: MOCK_NEW_OWNER_EMAIL }),
        );
      });
    });

    it('submits the chosen default language', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: mockClientTenant({ locale: LOCALE_ISO_CODES.NL }),
      });
      setup();

      const dutchButton = screen.getByRole('button', { name: DUTCH_LABEL });
      await user.click(dutchButton);
      await user.click(getSaveButton());

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          detailsValuesOf(DEFAULT_TENANT, { locale: LOCALE_ISO_CODES.NL }),
        );
      });
    });

    it('confirms a successful save with a toast that outlives further edits', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
      });
      setup();

      const nameInput = getNameInput();
      await replaceValue(nameInput, MOCK_RENAMED_TENANT_NAME);
      await user.click(getSaveButton());

      const savedToast = await screen.findByText(
        tenantDetailsPanel.alertSuccess,
      );
      expect(savedToast).toBeVisible();

      await user.type(nameInput, MOCK_EDITED_NAME);
      const savedToastAfterEdit = screen.getByText(
        tenantDetailsPanel.alertSuccess,
      );

      expect(savedToastAfterEdit).toBeVisible();
    });

    it('shows a taken-domain error, with no refresh or success toast', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
        },
      });
      setup();

      await replaceValue(getDomainInput(), MOCK_OTHER_TENANT_DOMAIN);
      await user.click(getSaveButton());

      const domainTakenError = await screen.findByText(
        tenantFieldErrors.domainTaken,
      );
      const savedToast = screen.queryByText(tenantDetailsPanel.alertSuccess);

      expect(domainTakenError).toBeVisible();
      expect(savedToast).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('marks each field with an error invalid and describes it by that error', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED },
          primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
        },
      });
      setup();

      const nameInput = getNameInput();
      await user.type(nameInput, MOCK_EDITED_NAME);
      await user.click(getSaveButton());
      await screen.findByText(tenantFieldErrors.nameRequired);
      const domainInput = getDomainInput();

      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription(
        tenantFieldErrors.nameRequired,
      );
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription(
        tenantFieldErrors.domainInvalid,
      );
    });

    it('shows an owner email error when the address already has a pending invite', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
        },
      });
      setup();

      await saveWithOwnerEmail(MOCK_INVITED_OWNER_EMAIL);

      const ownerEmailInput = await screen.findByRole('textbox', {
        name: OWNER_EMAIL_LABEL,
      });
      expect(ownerEmailInput).toBeInvalid();
      expect(ownerEmailInput).toHaveAccessibleDescription(
        tenantFieldErrors.ownerEmailTaken,
      );
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it.each(REFUSAL_CASES)(
      'shows the specific refusal instead of the generic save error ($reason)',
      async ({ reason, message }) => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.REFUSED,
          reason,
        });
        setup();

        await saveWithOwnerEmail(MOCK_NEW_OWNER_EMAIL);

        const refusalMessage = await screen.findByText(message);
        const saveFailedAlert = screen.queryByText(
          tenantDetailsPanel.errors.saveFailed,
        );

        expect(refusalMessage).toBeVisible();
        expect(saveFailedAlert).not.toBeInTheDocument();
        expect(refreshMock).not.toHaveBeenCalled();
      },
    );
  });

  describe('with one field locked', () => {
    it('disables the locked field and states why', () => {
      setup({ fieldLocks: DOMAIN_LOCKED });

      const domainInput = getDomainInput();

      expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(domainInput).toBeDisabled();
      expect(domainInput).toHaveAccessibleDescription(MOCK_DOMAIN_LOCKED_HINT);
    });

    it('keeps every other field editable', () => {
      setup({ fieldLocks: DOMAIN_LOCKED });

      const nameInput = getNameInput();
      const ownerEmailInput = getOwnerEmailInput();
      const freeButton = screen.getByRole('button', { name: FREE_LABEL });
      const englishButton = screen.getByRole('button', { name: ENGLISH_LABEL });

      expect(nameInput).toBeEnabled();
      expect(ownerEmailInput).toBeEnabled();
      expect(freeButton).toBeEnabled();
      expect(englishButton).toBeEnabled();
    });

    it('saves a correction to an unlocked field', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: mockClientTenant({ primaryDomain: MOCK_NEW_DOMAIN }),
      });
      setup({
        fieldLocks: {
          name: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
        },
      });

      await replaceValue(getDomainInput(), MOCK_NEW_DOMAIN);
      await user.click(getSaveButton());

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          detailsValuesOf(DEFAULT_TENANT, { primaryDomain: MOCK_NEW_DOMAIN }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('locks the plan with a succeeded reason once provisioning finished', () => {
      setup({
        tenant: mockClientTenant({ plan: TENANT_PLAN.GROWTH }),
        fieldLocks: { plan: { kind: 'succeeded' } },
      });

      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
      const growthButton = screen.getByRole('button', { name: GROWTH_LABEL });

      expect(planGroup).toHaveAccessibleDescription(
        tenantDetailsPanel.fieldLockedReasonSucceeded,
      );
      expect(growthButton).toBeDisabled();
      expect(growthButton).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('flags a server-side lock the client did not know about on the input', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          primaryDomain: {
            reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
            values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
          },
        },
      });
      setup();

      await replaceValue(getDomainInput(), MOCK_NEW_DOMAIN);
      await user.click(getSaveButton());

      const domainInput = await screen.findByRole('textbox', {
        name: PRIMARY_DOMAIN_LABEL,
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription(MOCK_DOMAIN_LOCKED_HINT);
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('with every field locked', () => {
    it('disables every control, Save included', () => {
      setup({
        tenant: mockClientTenant({ plan: TENANT_PLAN.GROWTH }),
        fieldLocks: ALL_LOCKED_RUNNING,
      });

      const controls = [
        getNameInput(),
        getDomainInput(),
        getOwnerEmailInput(),
        screen.getByRole('button', { name: ENGLISH_LABEL }),
        screen.getByRole('button', { name: GROWTH_LABEL }),
        getSaveButton(),
      ];

      controls.forEach((control) => expect(control).toBeDisabled());
    });
  });

  describe('when a field locks mid-edit', () => {
    let rerender: ReturnType<typeof setup>['rerender'];

    beforeEach(() => {
      ({ rerender } = setup());
    });

    it('reverts the field being edited to the server value', async () => {
      const domainInput = getDomainInput();
      await replaceValue(domainInput, MOCK_UNSAVED_DOMAIN);
      expect(domainInput).toHaveValue(MOCK_UNSAVED_DOMAIN);

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
      expect(domainInput).toBeDisabled();
    });

    it('leaves an unrelated field’s unsaved edit alone', async () => {
      const nameInput = getNameInput();
      await replaceValue(nameInput, MOCK_UNSAVED_NAME);
      await user.tab();

      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      expect(nameInput).toHaveValue(MOCK_UNSAVED_NAME);
    });

    it('announces the lock to assistive tech', () => {
      rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

      const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);

      expect(liveRegion).toHaveTextContent(
        tenantDetailsPanel.lockedAnnouncement,
      );
    });
  });

  describe('Save button', () => {
    it('enables on an edit and disables again once edited back', async () => {
      setup();

      const nameInput = getNameInput();
      const saveButton = getSaveButton();

      await replaceValue(nameInput, MOCK_RENAMED_TENANT_NAME);
      expect(saveButton).toBeEnabled();

      await replaceValue(nameInput, MOCK_TENANT_NAME);
      expect(saveButton).toBeDisabled();
    });

    it('announces the pending state and stays disabled while a save is in flight', async () => {
      let resolveAction: (value: {
        outcome: typeof ACTION_OUTCOME.SUCCESS;
        tenant: TClientTenant;
      }) => void = () => {};
      updateTenantDetailsActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      setup();

      await replaceValue(getNameInput(), MOCK_RENAMED_TENANT_NAME);
      await user.click(getSaveButton());

      const savingButton = await screen.findByRole('button', {
        name: SAVING_LABEL,
      });
      const status = screen.getByRole('status');

      expect(savingButton).toBeDisabled();
      expect(savingButton).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveTextContent(SAVING_LABEL);

      resolveAction({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('disables again once the refreshed tenant arrives after a save', async () => {
      const savedTenant = mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME });
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
        tenant: savedTenant,
      });
      const { rerender } = setup();

      await replaceValue(getNameInput(), MOCK_RENAMED_TENANT_NAME);
      await user.click(getSaveButton());
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());

      rerender(panel({ tenant: savedTenant }));

      const saveButton = await screen.findByRole('button', {
        name: SAVE_CHANGES,
      });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('with an archived tenant', () => {
    const ARCHIVED_TENANT = mockClientTenant({
      deprovisionedAt: MOCK_ARCHIVED_AT,
    });

    it('disables every field and Save, and never calls the action', async () => {
      setup({ tenant: ARCHIVED_TENANT });

      const controls = [
        getNameInput(),
        getDomainInput(),
        getOwnerEmailInput(),
        screen.getByRole('button', { name: ENGLISH_LABEL }),
        screen.getByRole('button', { name: FREE_LABEL }),
      ];
      const saveButton = getSaveButton();
      await user.click(saveButton);

      controls.forEach((control) => expect(control).toBeDisabled());
      expect(saveButton).toBeDisabled();
      expect(updateTenantDetailsActionMock).not.toHaveBeenCalled();
    });

    it('states on each field that the tenant is archived', () => {
      setup({ tenant: ARCHIVED_TENANT });

      const nameInput = getNameInput();
      const planGroup = screen.getByRole('group', { name: PLAN_LABEL });

      expect(nameInput).toHaveAccessibleDescription(
        tenantDetailsPanel.fieldLockedReasonArchived,
      );
      expect(planGroup).toHaveAccessibleDescription(
        tenantDetailsPanel.fieldLockedReasonArchived,
      );
    });

    it('leaves Save undescribed without an archived notice', () => {
      setup({ tenant: ARCHIVED_TENANT });

      const saveButton = getSaveButton();

      expect(saveButton).not.toHaveAttribute('aria-describedby');
    });

    it('describes the disabled Save with the page-level archived notice', () => {
      renderWithIntl(
        <>
          {panel({
            tenant: ARCHIVED_TENANT,
            archivedNoticeId: ARCHIVED_NOTICE_ID,
          })}
          <p id={ARCHIVED_NOTICE_ID}>{ARCHIVED_NOTICE_TEXT}</p>
        </>,
      );

      const saveButton = getSaveButton();

      expect(saveButton).toHaveAccessibleDescription(ARCHIVED_NOTICE_TEXT);
    });
  });

  describe('leaving with unsaved edits', () => {
    const push = vi.mocked(vi.mocked(useGuardRouter)().push);

    beforeEach(() => {
      push.mockReset();
      renderWithIntl(
        <>
          {panel()}
          <GuardedLink href={adminRoutes.tenants()}>
            {TENANTS_LABEL}
          </GuardedLink>
        </>,
      );
    });

    it('navigates without asking when nothing is edited', async () => {
      const tenantsLink = screen.getByRole('link', { name: TENANTS_LABEL });
      await user.click(tenantsLink);

      const alertDialog = screen.queryByRole('alertdialog');

      expect(push).toHaveBeenCalledWith(adminRoutes.tenants());
      expect(alertDialog).not.toBeInTheDocument();
    });

    describe('with an edited name', () => {
      let nameInput: HTMLElement;

      beforeEach(async () => {
        nameInput = getNameInput();
        await replaceValue(nameInput, MOCK_UNSAVED_NAME);
        const tenantsLink = screen.getByRole('link', { name: TENANTS_LABEL });
        await user.click(tenantsLink);
      });

      it('asks first, then restores the saved values on Discard and leave', async () => {
        const leaveDialog = screen.getByRole('alertdialog', {
          name: leavePageDialog.title,
        });
        expect(leaveDialog).toHaveAccessibleDescription(
          t('leavePageDialog.description', {
            count: 1,
            page: tenantDetailsPanel.heading,
          }),
        );
        expect(push).not.toHaveBeenCalled();

        const discardButton = screen.getByRole('button', {
          name: leavePageDialog.discardAndLeave,
        });
        await user.click(discardButton);

        expect(push).toHaveBeenCalledWith(adminRoutes.tenants());
        expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
      });

      it('saves the edits before leaving on Save and leave', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
          tenant: DEFAULT_TENANT,
        });

        const saveAndLeaveButton = screen.getByRole('button', {
          name: leavePageDialog.saveAndLeave,
        });
        await user.click(saveAndLeaveButton);

        await waitFor(() =>
          expect(push).toHaveBeenCalledWith(adminRoutes.tenants()),
        );
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          detailsValuesOf(DEFAULT_TENANT, { name: MOCK_UNSAVED_NAME }),
        );
      });

      it('stays on the page with the save error when Save and leave fails', async () => {
        updateTenantDetailsActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });

        const saveAndLeaveButton = screen.getByRole('button', {
          name: leavePageDialog.saveAndLeave,
        });
        await user.click(saveAndLeaveButton);

        const saveFailedMessage = await screen.findByText(
          tenantDetailsPanel.errors.saveFailed,
        );

        expect(saveFailedMessage).toBeVisible();
        expect(push).not.toHaveBeenCalled();
        expect(nameInput).toHaveValue(MOCK_UNSAVED_NAME);
      });
    });
  });
});
