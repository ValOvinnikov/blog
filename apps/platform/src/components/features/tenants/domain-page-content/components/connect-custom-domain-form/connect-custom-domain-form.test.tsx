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
    const submit = screen.getByRole('button', SUBMIT_BUTTON);

    await user.click(submit);

    const domainField = await screen.findByRole('textbox', DOMAIN_FIELD);
    expect(connectCustomDomainAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      domain: MOCK_CUSTOM_DOMAIN,
    });
    expect(domainField).toHaveValue('');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the field error the action returns and keeps the input', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    const submit = screen.getByRole('button', SUBMIT_BUTTON);

    await user.click(submit);

    const error = await screen.findByText(ownDomain.fieldError.domainTaken);
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);
    expect(error).toBeVisible();
    expect(domainField).toHaveValue(MOCK_CUSTOM_DOMAIN);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('clears the field error once the input changes', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);
    await screen.findByText(ownDomain.fieldError.domainTaken);
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);

    await user.type(domainField, 'x');

    const error = screen.queryByText(ownDomain.fieldError.domainTaken);
    expect(error).not.toBeInTheDocument();
  });

  it('reports a refusal without touching the input', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });
    const submit = screen.getByRole('button', SUBMIT_BUTTON);

    await user.click(submit);

    const message = await screen.findByText(ownDomain.refusal.alreadyConnected);
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);
    expect(message).toBeVisible();
    expect(domainField).toHaveValue(MOCK_CUSTOM_DOMAIN);
  });

  it('reports a server error and keeps the input so it can be retried', async () => {
    vi.mocked(connectCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    const submit = screen.getByRole('button', SUBMIT_BUTTON);

    await user.click(submit);

    const message = await screen.findByText(ownDomain.connectFailed);
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);
    expect(message).toBeVisible();
    expect(domainField).toHaveValue(MOCK_CUSTOM_DOMAIN);
  });
});
