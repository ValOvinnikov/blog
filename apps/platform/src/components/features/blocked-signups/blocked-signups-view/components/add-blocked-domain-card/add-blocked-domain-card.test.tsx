import { ACTION_OUTCOME } from '@blog/config';
import { SIGNUP_BLOCK_FIELD_ERROR } from '@platform/constants/signup-block';
import messages from '@platform/i18n/messages/en.json';
import { addBlockedDomainAction } from '@platform/server/signup-block/add-blocked-domain-action';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_DOMAIN,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AddBlockedDomainCard } from './add-blocked-domain-card';

vi.mock('@platform/server/signup-block/add-blocked-domain-action');

const { addBlockedDomainCard } = messages;
const DOMAIN_FIELD = { name: addBlockedDomainCard.domainLabel };
const REASON_FIELD = { name: addBlockedDomainCard.reasonLabel };
const SUBMIT_BUTTON = { name: addBlockedDomainCard.blockSubmit };

const setup = customRender(AddBlockedDomainCard, {});

describe(`<${AddBlockedDomainCard.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(async () => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setup();

    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);
    const reasonField = screen.getByRole('textbox', REASON_FIELD);
    await user.type(domainField, MOCK_BLOCKED_DOMAIN);
    await user.type(reasonField, MOCK_BLOCK_REASON);
  });

  it('submits the entered domain and reason, then clears the form', async () => {
    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    const domainField = await screen.findByRole('textbox', DOMAIN_FIELD);

    expect(addBlockedDomainAction).toHaveBeenCalledWith({
      domain: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
    });
    expect(domainField).toHaveValue('');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the field errors the action returns and keeps the input', async () => {
    vi.mocked(addBlockedDomainAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
      },
    });

    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    const error = await screen.findByText(
      addBlockedDomainCard.domainFormatInvalid,
    );
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);

    expect(error).toBeVisible();
    expect(domainField).toHaveValue(MOCK_BLOCKED_DOMAIN);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps the input and does not refresh when the action fails', async () => {
    vi.mocked(addBlockedDomainAction).mockResolvedValueOnce({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    const error = await screen.findByText(
      addBlockedDomainCard.domainBlockFailed,
    );
    const reasonField = screen.getByRole('textbox', REASON_FIELD);

    expect(error).toBeVisible();
    expect(reasonField).toHaveValue(MOCK_BLOCK_REASON);
    expect(refresh).not.toHaveBeenCalled();
  });
});
