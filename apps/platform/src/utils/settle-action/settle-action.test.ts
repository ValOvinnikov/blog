import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { UnrecognizedActionError } from 'next/dist/client/components/unrecognized-action-error';
import { notFound, redirect } from 'next/navigation';

vi.mock('next/navigation', (importOriginal) => importOriginal());

faker.seed(6716);

type TSettleActionModule = typeof import('./settle-action');
type TPageOutOfDateModule =
  typeof import('@platform/utils/page-out-of-date/page-out-of-date');

const SUCCESS_RESULT = { outcome: ACTION_OUTCOME.SUCCESS };
const STILL_PENDING = Symbol('still pending');

const thrownBy = (navigate: () => never): unknown => {
  try {
    navigate();
  } catch (error) {
    return error;
  }
};

describe('settleAction', () => {
  let settleAction: TSettleActionModule['settleAction'];
  let readIsPageOutOfDate: TPageOutOfDateModule['readIsPageOutOfDate'];

  beforeEach(async () => {
    vi.resetModules();
    ({ settleAction } = await import('./settle-action'));
    ({ readIsPageOutOfDate } =
      await import('@platform/utils/page-out-of-date/page-out-of-date'));
  });

  it('passes through the result of a request that reaches the server', async () => {
    await expect(settleAction(Promise.resolve(SUCCESS_RESULT))).resolves.toBe(
      SUCCESS_RESULT,
    );
  });

  it('settles an unreached request as a server error and leaves the page current', async () => {
    await expect(
      settleAction(Promise.reject(MOCK_UNREACHED_REQUEST)),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(readIsPageOutOfDate()).toBe(false);
  });

  it('marks the page out of date when the build lacks the action, and never settles', async () => {
    const settled = settleAction(
      Promise.reject(new UnrecognizedActionError(faker.lorem.sentence())),
    );

    await vi.waitFor(() => expect(readIsPageOutOfDate()).toBe(true));
    await expect(Promise.race([settled, STILL_PENDING])).resolves.toBe(
      STILL_PENDING,
    );
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
