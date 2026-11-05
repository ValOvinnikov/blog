import { ACTION_OUTCOME } from '@blog/config';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';

import { settleAction } from './settle-action';

const SUCCESS_RESULT = { outcome: ACTION_OUTCOME.SUCCESS };

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
});
