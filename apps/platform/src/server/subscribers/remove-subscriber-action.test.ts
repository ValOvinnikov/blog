import { faker } from '@faker-js/faker';
import {
  SUBSCRIBERS_LOG,
  SUBSCRIBERS_REFUSAL,
} from '@platform/constants/subscribers';
import { requireSubscribersManager } from '@platform/server/subscribers/require-subscribers-manager';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  NEXT_NAVIGATION_ERROR,
  SUBSCRIBER_OUTCOME,
} from '@shinefold/config';
import { notFound } from 'next/navigation';

import { removeSubscriberAction } from './remove-subscriber-action';

faker.seed(7164);

const { unsubscribeByIdMock } = vi.hoisted(() => ({
  unsubscribeByIdMock: vi.fn(),
}));

vi.mock('@platform/server/subscribers/require-subscribers-manager');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { subscribers: { unsubscribeById: unsubscribeByIdMock } },
}));

const MOCK_SUBSCRIBER_ID = faker.string.uuid();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const NOT_FOUND_RESULT = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SUBSCRIBERS_REFUSAL.NOT_FOUND,
};

describe(removeSubscriberAction, () => {
  beforeEach(() => {
    unsubscribeByIdMock
      .mockReset()
      .mockResolvedValue({ outcome: SUBSCRIBER_OUTCOME.UNSUBSCRIBED });
  });

  it("removes the subscriber from the caller's own site", async () => {
    const result = await removeSubscriberAction(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER_ID,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(unsubscribeByIdMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER_ID,
    );
  });

  it('refuses a caller who cannot manage the site, such as an editor', async () => {
    vi.mocked(requireSubscribersManager).mockImplementationOnce(() => {
      notFound();
    });

    await expect(
      removeSubscriberAction(MOCK_TENANT_ID, MOCK_SUBSCRIBER_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(unsubscribeByIdMock).not.toHaveBeenCalled();
  });

  it('refuses an id that is not a subscriber id', async () => {
    const result = await removeSubscriberAction(
      MOCK_TENANT_ID,
      faker.lorem.word(),
    );

    expect(result).toEqual(NOT_FOUND_RESULT);
    expect(unsubscribeByIdMock).not.toHaveBeenCalled();
  });

  it('refuses a subscriber the site no longer has', async () => {
    unsubscribeByIdMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.NOT_FOUND,
    });

    const result = await removeSubscriberAction(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER_ID,
    );

    expect(result).toEqual(NOT_FOUND_RESULT);
  });

  it('logs a failed removal and reports a server error', async () => {
    unsubscribeByIdMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await removeSubscriberAction(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER_ID,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SUBSCRIBERS_LOG.REMOVE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
