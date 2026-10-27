import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PROVISIONING_STEP } from '@blog/db';
import { faker } from '@faker-js/faker';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
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
import { tenantDetailsValuesOf } from './tenant-details-values';

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
  leavePageDialog,
} = messages;
const t = makeEnTranslator();

const LOCK_ANNOUNCEMENT_LIVE = 'lock-announcement-live';
const NAME_LABEL = tenantDetailsPanel.nameLabel;
const PLAN_LABEL = tenantDetailsPanel.planLabel;
const FIELDS_GROUP_LABEL = tenantDetailsPanel.fieldsGroupLabel;
const SAVING_LABEL = tenantDetailsPanel.savingButton;
const TENANTS_LABEL = navSections.tenants;
const ENGLISH_LABEL = languageNames[LOCALE_ISO_CODES.EN];
const FREE_LABEL = tenantDetailsPanel.planOptionFree;
const MOCK_UNSAVED_DOMAIN = faker.internet.domainName();
const MOCK_UNSAVED_NAME = faker.company.name();
const MOCK_EDITED_NAME = faker.company.name();

const DOMAIN_LOCKED: TTenantFieldLocks = {
  primaryDomain: { kind: 'step', step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
};

const DEFAULT_TENANT = mockClientTenant();
const ARCHIVED_TENANT = mockClientTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });
const DEFAULT_PROPS: TTenantDetailsPanelProps = {
  tenant: DEFAULT_TENANT,
  fieldLocks: {},
  owner: mockJoinedOwner(),
};

const panel = (props: Partial<TTenantDetailsPanelProps> = {}) => (
  <TenantDetailsPanel {...DEFAULT_PROPS} {...props} />
);

const setup = customRender(TenantDetailsPanel, DEFAULT_PROPS);

const getNameInput = () => screen.getByRole('textbox', { name: NAME_LABEL });
const getDomainInput = () =>
  screen.getByRole('textbox', { name: PRIMARY_DOMAIN_LABEL });
const getSaveButton = () => screen.getByRole('button', { name: SAVE_CHANGES });

describe(`<${TenantDetailsPanel.name}/>`, () => {
  let refreshMock: ReturnType<typeof mockRouterRefresh>;
  let user: UserEvent;

  const replaceValue = async (input: HTMLElement, value: string) => {
    await user.clear(input);
    await user.type(input, value);
  };

  beforeEach(() => {
    user = userEvent.setup();
    updateTenantDetailsActionMock.mockReset();
    refreshMock = mockRouterRefresh();
  });

  it('exposes the fields as a named group', () => {
    setup();

    const fieldsGroup = screen.getByRole('group', { name: FIELDS_GROUP_LABEL });

    expect(fieldsGroup).toBeVisible();
  });

  it('enables Save only while a field differs from its saved value', async () => {
    setup();

    const nameInput = getNameInput();
    const saveButton = getSaveButton();
    expect(saveButton).toBeDisabled();

    await replaceValue(nameInput, MOCK_RENAMED_TENANT_NAME);
    expect(saveButton).toBeEnabled();

    await replaceValue(nameInput, MOCK_TENANT_NAME);
    expect(saveButton).toBeDisabled();
  });

  it('saves the edited values and keeps the success toast through further edits', async () => {
    updateTenantDetailsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
    });
    setup();

    const nameInput = getNameInput();
    await replaceValue(nameInput, MOCK_RENAMED_TENANT_NAME);
    await user.click(getSaveButton());
    await screen.findByText(tenantDetailsPanel.alertSuccess);
    await user.type(nameInput, MOCK_EDITED_NAME);

    const savedToast = screen.getByText(tenantDetailsPanel.alertSuccess);

    expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      tenantDetailsValuesOf(
        mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
        MOCK_OWNER_EMAIL,
      ),
    );
    expect(savedToast).toBeVisible();
  });

  it('shows a field error the save returns on that field', async () => {
    updateTenantDetailsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    setup();

    await replaceValue(getDomainInput(), MOCK_OTHER_TENANT_DOMAIN);
    await user.click(getSaveButton());
    await screen.findByText(tenantFieldErrors.domainTaken);

    expect(getDomainInput()).toHaveAccessibleDescription(
      tenantFieldErrors.domainTaken,
    );
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

    expect(savingButton).toHaveAttribute('aria-disabled', 'true');
    expect(savingButton).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(SAVING_LABEL);

    resolveAction({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: mockClientTenant({ name: MOCK_RENAMED_TENANT_NAME }),
    });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('reverts, announces and moves focus when the field being edited locks', async () => {
    const { rerender } = setup();
    const domainInput = getDomainInput();
    await replaceValue(domainInput, MOCK_UNSAVED_DOMAIN);

    rerender(panel({ fieldLocks: DOMAIN_LOCKED }));

    const liveRegion = screen.getByTestId(LOCK_ANNOUNCEMENT_LIVE);
    const fieldsGroup = screen.getByRole('group', { name: FIELDS_GROUP_LABEL });

    expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
    expect(domainInput).toBeDisabled();
    expect(liveRegion).toHaveTextContent(tenantDetailsPanel.lockedAnnouncement);
    expect(fieldsGroup).toHaveFocus();
  });

  describe('with an archived tenant', () => {
    it('disables every field and Save, and never calls the action', async () => {
      setup({ tenant: ARCHIVED_TENANT });

      const controls = [
        getNameInput(),
        getDomainInput(),
        screen.getByRole('textbox', { name: OWNER_EMAIL_LABEL }),
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

      expect(getSaveButton()).not.toHaveAttribute('aria-describedby');
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

      expect(getSaveButton()).toHaveAccessibleDescription(ARCHIVED_NOTICE_TEXT);
    });
  });

  describe('leaving with an edited name', () => {
    const push = vi.mocked(vi.mocked(useGuardRouter)().push);
    let nameInput: HTMLElement;

    beforeEach(async () => {
      push.mockReset();
      renderWithIntl(
        <>
          {panel()}
          <GuardedLink href={adminRoutes.tenants()}>
            {TENANTS_LABEL}
          </GuardedLink>
        </>,
      );
      nameInput = getNameInput();
      await replaceValue(nameInput, MOCK_UNSAVED_NAME);
      await user.click(screen.getByRole('link', { name: TENANTS_LABEL }));
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

      await user.click(
        screen.getByRole('button', { name: leavePageDialog.discardAndLeave }),
      );

      expect(push).toHaveBeenCalledWith(adminRoutes.tenants());
      expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
    });

    it('stays with the edits and the save error when Save and leave fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(
        screen.getByRole('button', { name: leavePageDialog.saveAndLeave }),
      );

      const saveFailedAlert = await screen.findByText(
        tenantDetailsPanel.errors.saveFailed,
      );

      expect(saveFailedAlert).toBeVisible();
      expect(push).not.toHaveBeenCalled();
      expect(nameInput).toHaveValue(MOCK_UNSAVED_NAME);
    });
  });
});
