import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { act, renderHook } from '@testing-library/react';

import { useStagedStepStatuses } from './use-staged-step-statuses';

const { IDLE, RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;

const STEP_REVEAL_DWELL_MS = 800;

const advanceOneReveal = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_REVEAL_DWELL_MS);
  });
};

describe(useStagedStepStatuses, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (initial: TTenantProvisioningStepStatus[]) =>
    renderHook(({ target }) => useStagedStepStatuses(target), {
      initialProps: { target: initial },
    });

  it('shows the statuses it mounts with straight away', () => {
    const { result } = setup([DONE, DONE, FAILED]);

    expect(result.current).toEqual({
      stagedStatuses: [DONE, DONE, FAILED],
      isRevealing: false,
    });
  });

  it('shows a step that went from not started to complete as running first', async () => {
    const { result, rerender } = setup([IDLE, IDLE]);

    rerender({ target: [DONE, IDLE] });

    expect(result.current).toEqual({
      stagedStatuses: [IDLE, IDLE],
      isRevealing: true,
    });

    await advanceOneReveal();
    expect(result.current.stagedStatuses).toEqual([RUNNING, IDLE]);

    await advanceOneReveal();
    expect(result.current).toEqual({
      stagedStatuses: [DONE, IDLE],
      isRevealing: false,
    });
  });

  it('replays several steps that advanced together one change at a time, in order', async () => {
    const { result, rerender } = setup([RUNNING, IDLE, IDLE]);

    rerender({ target: [DONE, DONE, RUNNING] });

    const seen: TTenantProvisioningStepStatus[][] = [];
    for (let reveal = 0; reveal < 4; reveal += 1) {
      await advanceOneReveal();
      seen.push(result.current.stagedStatuses);
    }

    expect(seen).toEqual([
      [DONE, IDLE, IDLE],
      [DONE, RUNNING, IDLE],
      [DONE, DONE, IDLE],
      [DONE, DONE, RUNNING],
    ]);
  });

  it('applies a step going back to not started at once, without replaying it', () => {
    const { result, rerender } = setup([DONE, FAILED]);

    rerender({ target: [DONE, IDLE] });

    expect(result.current).toEqual({
      stagedStatuses: [DONE, IDLE],
      isRevealing: false,
    });
  });
});
