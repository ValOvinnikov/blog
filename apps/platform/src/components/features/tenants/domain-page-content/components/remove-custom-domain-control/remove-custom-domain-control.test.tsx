import { ACTION_OUTCOME } from '@blog/config';
import { CUSTOM_DOMAIN_REFUSAL } from '@platform/constants/custom-domain';
import en from '@platform/i18n/messages/en.json';
import { removeCustomDomainAction } from '@platform/server/custom-domain/remove-custom-domain-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { RemoveCustomDomainControl } from './remove-custom-domain-control';

vi.mock('@platform/server/custom-domain/remove-custom-domain-action');

const { ownDomain } = en.tenantDomainPage;

const setup = customRender(RemoveCustomDomainControl, {
  tenantId: MOCK_TENANT_ID,
  domain: MOCK_CUSTOM_DOMAIN,
});

describe(`<${RemoveCustomDomainControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(removeCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();
    const trigger = screen.getByRole('button', { name: ownDomain.remove });

    await user.click(trigger);
  });

  const confirmRemoval = async () => {
    const confirm = await screen.findByRole('button', {
      name: ownDomain.removeConfirm,
    });
    await user.click(confirm);
  };

  it('removes nothing until the dialog is confirmed', () => {
    expect(removeCustomDomainAction).not.toHaveBeenCalled();
  });

  it('removes the domain on confirm and refreshes the page', async () => {
    await confirmRemoval();

    expect(removeCustomDomainAction).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      domain: MOCK_CUSTOM_DOMAIN,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the refusal in the dialog and does not refresh', async () => {
    vi.mocked(removeCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN,
    });

    await confirmRemoval();

    const message = await screen.findByText(ownDomain.refusal.notCustomDomain);
    expect(message).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('shows a failure message in the dialog on a server error', async () => {
    vi.mocked(removeCustomDomainAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await confirmRemoval();

    const message = await screen.findByText(ownDomain.removeFailed);
    expect(message).toBeVisible();
  });
});
