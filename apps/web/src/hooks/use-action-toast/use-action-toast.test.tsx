import { faker } from '@faker-js/faker';
import {
  ACTION_OUTCOME,
  type TActionOutcome,
  type TOutcome,
} from '@shinefold/config';
import { ToastProvider } from '@web/context/toast-provider';
import { act, renderHook, screen, waitFor } from '@web/testing/custom-render';
import { AppProviders } from '@web/testing/providers';
import { stubRouterRefresh } from '@web/testing/shared/router/stub-router-refresh';
import { findToastStatus } from '@web/testing/shared/toast/find-toast-status';
import type { ReactNode } from 'react';

import { useActionToast } from './use-action-toast';

faker.seed(6012);

const { routerRefreshMock } = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
}));

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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProviders>
    <ToastProvider>{children}</ToastProvider>
  </AppProviders>
);

const runAction = (
  outcome: Promise<TOutcome<TActionOutcome>>,
  onSuccess?: () => void,
) => {
  const { result } = renderHook(useActionToast, { wrapper });
  act(() => {
    result.current.run(() => outcome, { ...MOCK_OPTIONS, onSuccess });
  });
  return result;
};

describe(useActionToast, () => {
  beforeEach(() => {
    stubRouterRefresh(routerRefreshMock);
  });

  it('shows the success toast and refreshes the route on success', async () => {
    runAction(Promise.resolve({ outcome: ACTION_OUTCOME.SUCCESS }));

    const successToast = await findToastStatus();

    expect(successToast).toHaveTextContent(MOCK_SUCCESS);
    await waitFor(() => expect(routerRefreshMock).toHaveBeenCalledOnce());
  });

  it('runs the given success callback on success', async () => {
    const onSuccess = vi.fn();

    runAction(Promise.resolve({ outcome: ACTION_OUTCOME.SUCCESS }), onSuccess);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('shows the outcome-specific error for a mapped failure without refreshing', async () => {
    runAction(Promise.resolve({ outcome: ACTION_OUTCOME.BLOCKED }));

    const errorToast = await screen.findByRole('alert');

    expect(errorToast).toHaveTextContent(MOCK_BLOCKED_ERROR);
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('shows the fallback error for an unmapped failure', async () => {
    runAction(Promise.resolve({ outcome: ACTION_OUTCOME.SERVER_ERROR }));

    const errorToast = await screen.findByRole('alert');

    expect(errorToast).toHaveTextContent(MOCK_ERROR);
  });

  it('shows the fallback error when the action throws', async () => {
    runAction(Promise.reject(new Error(faker.lorem.word())));

    const errorToast = await screen.findByRole('alert');

    expect(errorToast).toHaveTextContent(MOCK_ERROR);
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('reports pending until the action settles', async () => {
    const result = runAction(new Promise(() => {}));

    await waitFor(() => expect(result.current.isPending).toBe(true));
  });
});
