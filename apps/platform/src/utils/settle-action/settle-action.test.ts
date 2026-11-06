import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { notFound, redirect } from 'next/navigation';

import { settleAction } from './settle-action';

vi.mock('next/navigation', (importOriginal) => importOriginal());

faker.seed(6716);

const SUCCESS_RESULT = { outcome: ACTION_OUTCOME.SUCCESS };

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
