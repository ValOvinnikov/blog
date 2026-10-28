import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_PROVISIONING_STEP } from '@blog/db';
import { tenantDetailsValuesOf } from '@platform/components/features/tenants/tenant-details-panel/tenant-details-values';
import {
  TENANT_FIELD_ERROR,
  TENANT_FIELD_LOCK_KIND,
} from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  mockClientTenant,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  OWNER_EMAIL_LABEL,
  PRIMARY_DOMAIN_LABEL,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  TenantDetailsFields,
  type TTenantDetailsFieldsProps,
} from './tenant-details-fields';

const { tenantDetailsPanel, tenantFieldErrors, languageNames } = messages;
const t = makeEnTranslator();

const ARIA_PRESSED = 'aria-pressed';
const NAME_LABEL = tenantDetailsPanel.nameLabel;
const PLAN_LABEL = tenantDetailsPanel.planLabel;
const FREE_LABEL = tenantDetailsPanel.planOptionFree;
const GROWTH_LABEL = tenantDetailsPanel.planOptionGrowth;
const ENGLISH_LABEL = languageNames[LOCALE_ISO_CODES.EN];
const DUTCH_LABEL = languageNames[LOCALE_ISO_CODES.NL];
const MOCK_TYPED_CHARACTER = 'x';
const MOCK_DOMAIN_LOCKED_HINT = t('tenantDetailsPanel.fieldLockedReasonStep', {
  step: messages.provisioningStatusView.stepLabel[
    TENANT_PROVISIONING_STEP.MAP_DOMAIN
  ],
});

const FIELD_ERROR_CASES = [
  {
    label: NAME_LABEL,
    fieldErrors: { name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED } },
    text: tenantFieldErrors.nameRequired,
  },
  {
    label: PRIMARY_DOMAIN_LABEL,
    fieldErrors: {
      primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
    },
    text: tenantFieldErrors.domainTaken,
  },
  {
    label: PRIMARY_DOMAIN_LABEL,
    fieldErrors: {
      primaryDomain: {
        reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
        values: { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN },
      },
    },
    text: MOCK_DOMAIN_LOCKED_HINT,
  },
  {
    label: PRIMARY_DOMAIN_LABEL,
    fieldErrors: {
      primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_CUSTOM_MAIN },
    },
    text: tenantFieldErrors.domainCustomMain,
  },
  {
    label: OWNER_EMAIL_LABEL,
    fieldErrors: {
      ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
    },
    text: tenantFieldErrors.ownerEmailTaken,
  },
];

const DEFAULT_PROPS: TTenantDetailsFieldsProps = {
  values: tenantDetailsValuesOf(mockClientTenant(), MOCK_OWNER_EMAIL),
  fieldLocks: {},
  fieldErrors: {},
  onChange: () => {},
};

const setup = customRender(TenantDetailsFields, DEFAULT_PROPS);

const getTextbox = (name: string) => screen.getByRole('textbox', { name });

describe(`<${TenantDetailsFields.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows every value, each field editable', () => {
    setup();

    const nameInput = getTextbox(NAME_LABEL);
    const domainInput = getTextbox(PRIMARY_DOMAIN_LABEL);
    const ownerEmailInput = getTextbox(OWNER_EMAIL_LABEL);
    const freeButton = screen.getByRole('button', { name: FREE_LABEL });
    const englishButton = screen.getByRole('button', { name: ENGLISH_LABEL });

    expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
    expect(nameInput).toBeEnabled();
    expect(domainInput).toHaveValue(MOCK_TENANT_DOMAIN);
    expect(ownerEmailInput).toHaveValue(MOCK_OWNER_EMAIL);
    expect(ownerEmailInput).toHaveAttribute('type', 'email');
    expect(freeButton).toHaveAttribute(ARIA_PRESSED, 'true');
    expect(freeButton).toBeEnabled();
    expect(englishButton).toHaveAttribute(ARIA_PRESSED, 'true');
    expect(englishButton).toBeEnabled();
  });

  it('reports each edit with the field it belongs to', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const ownerEmailInput = getTextbox(OWNER_EMAIL_LABEL);
    const dutchButton = screen.getByRole('button', { name: DUTCH_LABEL });
    const growthButton = screen.getByRole('button', { name: GROWTH_LABEL });
    await user.type(ownerEmailInput, MOCK_TYPED_CHARACTER);
    await user.click(dutchButton);
    await user.click(growthButton);

    expect(onChange).toHaveBeenCalledWith(
      'ownerEmail',
      `${MOCK_OWNER_EMAIL}${MOCK_TYPED_CHARACTER}`,
    );
    expect(onChange).toHaveBeenCalledWith('locale', LOCALE_ISO_CODES.NL);
    expect(onChange).toHaveBeenCalledWith('plan', TENANT_PLAN.GROWTH);
  });

  it('disables a locked text field and states why, leaving the others editable', () => {
    setup({
      fieldLocks: {
        primaryDomain: {
          kind: TENANT_FIELD_LOCK_KIND.STEP,
          step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        },
      },
    });

    const domainInput = getTextbox(PRIMARY_DOMAIN_LABEL);
    const nameInput = getTextbox(NAME_LABEL);

    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(MOCK_DOMAIN_LOCKED_HINT);
    expect(nameInput).toBeEnabled();
  });

  it('disables the domain of a custom main address and points to the Domain page', () => {
    setup({
      fieldLocks: {
        primaryDomain: { kind: TENANT_FIELD_LOCK_KIND.CUSTOM_MAIN_DOMAIN },
      },
    });

    const domainInput = getTextbox(PRIMARY_DOMAIN_LABEL);

    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      tenantDetailsPanel.fieldLockedReasonCustomMainDomain,
    );
  });

  it('disables a locked choice and states why, keeping its value shown', () => {
    setup({
      values: tenantDetailsValuesOf(
        mockClientTenant({ plan: TENANT_PLAN.GROWTH }),
        MOCK_OWNER_EMAIL,
      ),
      fieldLocks: { plan: { kind: TENANT_FIELD_LOCK_KIND.SUCCEEDED } },
    });

    const planGroup = screen.getByRole('group', { name: PLAN_LABEL });
    const growthButton = screen.getByRole('button', { name: GROWTH_LABEL });
    const englishButton = screen.getByRole('button', { name: ENGLISH_LABEL });

    expect(planGroup).toHaveAccessibleDescription(
      tenantDetailsPanel.fieldLockedReasonSucceeded,
    );
    expect(growthButton).toBeDisabled();
    expect(growthButton).toHaveAttribute(ARIA_PRESSED, 'true');
    expect(englishButton).toBeEnabled();
  });

  it.each(FIELD_ERROR_CASES)(
    'marks the field invalid and describes it by its error ($text)',
    ({ label, fieldErrors, text }) => {
      setup({ fieldErrors });

      const input = getTextbox(label);

      expect(input).toBeInvalid();
      expect(input).toHaveAccessibleDescription(text);
    },
  );
});
