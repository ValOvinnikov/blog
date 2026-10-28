import { ACTION_OUTCOME } from '@blog/config';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import en from '@platform/i18n/messages/en.json';
import { connectCustomDomainAction } from '@platform/server/custom-domain/connect-custom-domain-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ConnectCustomDomainForm } from './connect-custom-domain-form';

vi.mock('@platform/server/custom-domain/connect-custom-domain-action');

const { ownDomain } = en.tenantDomainPage;
const DOMAIN_FIELD = { name: ownDomain.domainLabel };
const SUBMIT_BUTTON = { name: ownDomain.connect };

const setup = customRender(ConnectCustomDomainForm, {
  tenantId: MOCK_TENANT_ID,
});

describe(`<${ConnectCustomDomainForm.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    await user.type(
      screen.getByRole('textbox', DOMAIN_FIELD),
      MOCK_CUSTOM_DOMAIN,
    );
  });

  it('submits the entered domain, clears the input and refreshes the page', async () => {
    await user.click(screen.getByRole('button', SUBMIT_BUTTON));

    expect(connectCustomDomainAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      domain: MOCK_CUSTOM_DOMAIN,
    });
    expect(await screen.findByRole('textbox', DOMAIN_FIELD)).toHaveValue('');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the field error the action returns and keeps the input', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });

    await user.click(screen.getByRole('button', SUBMIT_BUTTON));

    const error = await screen.findByText(ownDomain.fieldError.domainTaken);
    expect(error).toBeVisible();
    expect(screen.getByRole('textbox', DOMAIN_FIELD)).toHaveValue(
      MOCK_CUSTOM_DOMAIN,
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reports a refusal without touching the input', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });

    await user.click(screen.getByRole('button', SUBMIT_BUTTON));

    expect(
      await screen.findByText(ownDomain.refusal.alreadyConnected),
    ).toBeVisible();
    expect(screen.getByRole('textbox', DOMAIN_FIELD)).toHaveValue(
      MOCK_CUSTOM_DOMAIN,
    );
  });

  it('reports a server error and keeps the input so it can be retried', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await user.click(screen.getByRole('button', SUBMIT_BUTTON));

    expect(await screen.findByText(ownDomain.connectFailed)).toBeVisible();
    expect(screen.getByRole('textbox', DOMAIN_FIELD)).toHaveValue(
      MOCK_CUSTOM_DOMAIN,
    );
  });
});
