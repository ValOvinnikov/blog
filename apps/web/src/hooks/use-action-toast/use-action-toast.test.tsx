import { faker } from '@faker-js/faker';
import {
  ACTION_OUTCOME,
  SITE_MESSAGES,
  type TActionOutcome,
  type TOutcome,
} from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { ToastProvider } from '@web/context/toast-provider';
import { act, renderHook, screen, waitFor } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import {
  MOCK_UNRECOGNIZED_ACTION_ERROR,
  mockUnrecognizedActionError,
} from '@web/testing/shared/out-of-date/mock-unrecognized-action';
import { stubRouterRefresh } from '@web/testing/shared/router/stub-router-refresh';
import { findToastStatus } from '@web/testing/shared/toast/find-toast-status';

import { useActionToast } from './use-action-toast';

faker.seed(6012);

const routerRefreshMock = vi.fn();

const MOCK_LOADING = faker.lorem.sentence();
const MOCK_SUCCESS = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_BLOCKED_ERROR = faker.lorem.sentence();

const MOCK_OPTIONS = {
  loading: MOCK_LOADING,
  success: MOCK_SUCCESS,
  error: MOCK_ERROR,
  errorByOutcome: { [ACTION_OUTCOME.BLOCKED]: MOCK_BLOCKED_ERROR },
};

const wrapper = ({ children }: IWithChildren) => (
  <AppProviders>
    <ToastProvider>{children}</ToastProvider>
  </AppProviders>
);

const runAction = (
  action: () => Promise<TOutcome<TActionOutcome>>,
  onSuccess?: () => void,
) => {
  const { result } = renderHook(useActionToast, { wrapper });
  act(() => {
    result.current.run(action, { ...MOCK_OPTIONS, onSuccess });
  });
  return result;
};

describe(useActionToast, () => {
  beforeEach(() => {
    stubRouterRefresh(routerRefreshMock);
  });

  it('shows the success toast and refreshes the route on success', async () => {
    runAction(() => Promise.resolve({ outcome: ACTION_OUTCOME.SUCCESS }));

    const successToast = await findToastStatus();

    expect(successToast).toHaveTextContent(MOCK_SUCCESS);
    await waitFor(() => expect(routerRefreshMock).toHaveBeenCalledOnce());
  });

  it('runs the given success callback on success', async () => {
    const onSuccess = vi.fn();

    runAction(
      () => Promise.resolve({ outcome: ACTION_OUTCOME.SUCCESS }),
      onSuccess,
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      failure: 'a mapped outcome',
      action: () => Promise.resolve({ outcome: ACTION_OUTCOME.BLOCKED }),
      expectedMessage: MOCK_BLOCKED_ERROR,
    },
    {
      failure: 'an unmapped outcome',
      action: () => Promise.resolve({ outcome: ACTION_OUTCOME.SERVER_ERROR }),
      expectedMessage: MOCK_ERROR,
    },
    {
      failure: 'a thrown action',
      action: () => Promise.reject(new Error(faker.lorem.word())),
      expectedMessage: MOCK_ERROR,
    },
  ])(
    'shows its error toast without refreshing for $failure',
    async ({ action, expectedMessage }) => {
      runAction(action);

      const errorToast = await screen.findByRole('alert');

      expect(errorToast).toHaveTextContent(expectedMessage);
      expect(routerRefreshMock).not.toHaveBeenCalled();
    },
  );

  it('settles an unrecognised action into the out-of-date notice', async () => {
    mockUnrecognizedActionError();

    runAction(() => Promise.reject(MOCK_UNRECOGNIZED_ACTION_ERROR));

    const notice = await screen.findByRole('alert');
    const reloadButton = screen.getByRole('button', {
      name: SITE_MESSAGES.outOfDateNotice.reloadLabel,
    });
    expect(notice).toHaveTextContent(SITE_MESSAGES.outOfDateNotice.message);
    expect(notice).not.toHaveTextContent(MOCK_ERROR);
    expect(reloadButton).toBeVisible();
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('reports pending until the action settles', async () => {
    const { promise, resolve } =
      Promise.withResolvers<TOutcome<TActionOutcome>>();
    const result = runAction(() => promise);

    await waitFor(() => expect(result.current.isPending).toBe(true));

    resolve({ outcome: ACTION_OUTCOME.SUCCESS });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
