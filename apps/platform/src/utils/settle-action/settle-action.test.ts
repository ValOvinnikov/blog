import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { markPageOutOfDate } from '@platform/utils/page-out-of-date/page-out-of-date';
import { UnrecognizedActionError } from 'next/dist/client/components/unrecognized-action-error';
import { notFound, redirect } from 'next/navigation';

import { settleAction } from './settle-action';

vi.mock('next/navigation', (importOriginal) => importOriginal());
vi.mock('@platform/utils/page-out-of-date/page-out-of-date');

faker.seed(6716);

const SUCCESS_RESULT = { outcome: ACTION_OUTCOME.SUCCESS };
const STILL_PENDING = Symbol('still pending');

const thrownBy = (navigate: () => never): unknown => {
  try {
    navigate();
  } catch (error) {
    return error;
  }
};

describe(settleAction, () => {
  it('passes through the result of a request that reaches the server', async () => {
    await expect(settleAction(Promise.resolve(SUCCESS_RESULT))).resolves.toBe(
      SUCCESS_RESULT,
    );
  });

  it('settles a request that never reaches the server as a server error', async () => {
    await expect(
      settleAction(Promise.reject(MOCK_UNREACHED_REQUEST)),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('marks the page out of date when the build lacks the action, and never settles', async () => {
    const settled = settleAction(
      Promise.reject(new UnrecognizedActionError(faker.lorem.sentence())),
    );

    await vi.waitFor(() => expect(markPageOutOfDate).toHaveBeenCalledOnce());
    await expect(Promise.race([settled, STILL_PENDING])).resolves.toBe(
      STILL_PENDING,
    );
  });

  it('leaves the page current when a request never reaches the server', async () => {
    await settleAction(Promise.reject(MOCK_UNREACHED_REQUEST));

    expect(markPageOutOfDate).not.toHaveBeenCalled();
  });

  it.each([
    ['redirect', () => redirect(`/${faker.lorem.slug()}`)],
    ['notFound', () => notFound()],
  ])('still rejects with an action’s %s', async (_, navigate) => {
    const navigationError = thrownBy(navigate);

    await expect(settleAction(Promise.reject(navigationError))).rejects.toBe(
      navigationError,
    );
  });
});
