import { ACTION_OUTCOME } from '@blog/config';
import { SIGNUP_BLOCK_FIELD_ERROR } from '@platform/constants/signup-block';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_DOMAIN,
} from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { AddBlockedDomainCard } from './add-blocked-domain-card';

const { addBlockedDomainActionMock } = vi.hoisted(() => ({
  addBlockedDomainActionMock: vi.fn(),
}));

vi.mock('@platform/server/signup-block/add-blocked-domain-action', () => ({
  addBlockedDomainAction: addBlockedDomainActionMock,
}));

const DOMAIN_FIELD = { name: /^domain$/i };
const REASON_FIELD = { name: 'Reason' };
const SUBMIT_BUTTON = { name: 'Block domain' };

const setup = customRender(AddBlockedDomainCard, {});

describe(`<${AddBlockedDomainCard.name}/>`, () => {
  const refreshMock = vi.fn();
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    addBlockedDomainActionMock.mockReset().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
    setup();

    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);
    const reasonField = screen.getByRole('textbox', REASON_FIELD);
    await user.type(domainField, MOCK_BLOCKED_DOMAIN);
    await user.type(reasonField, MOCK_BLOCK_REASON);
  });

  it('submits the entered domain and reason, then clears the form', async () => {
    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    expect(addBlockedDomainActionMock).toHaveBeenCalledWith({
      domain: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
    });
    const domainField = await screen.findByRole('textbox', DOMAIN_FIELD);

    expect(domainField).toHaveValue('');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows the field errors the action returns and keeps the input', async () => {
    addBlockedDomainActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
      },
    });

    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    const error = await screen.findByText(
      'Enter a valid domain, such as example.com.',
    );
    const domainField = screen.getByRole('textbox', DOMAIN_FIELD);

    expect(error).toBeVisible();
    expect(domainField).toHaveValue(MOCK_BLOCKED_DOMAIN);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('keeps the input and does not refresh when the action fails', async () => {
    addBlockedDomainActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    const submit = screen.getByRole('button', SUBMIT_BUTTON);
    await user.click(submit);

    const error = await screen.findByText(/couldn't block the domain/i);
    const reasonField = screen.getByRole('textbox', REASON_FIELD);

    expect(error).toBeVisible();
    expect(reasonField).toHaveValue(MOCK_BLOCK_REASON);
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
