import { faker } from '@faker-js/faker';
import {
  COPY_STATUS,
  COPY_STATUS_RESET_MS,
} from '@platform/constants/clipboard';
import { act, renderHook } from '@testing-library/react';

import { useCopyToClipboard } from './use-copy-to-clipboard';

faker.seed(6608);

const MOCK_TEXT = faker.internet.domainName();
const originalClipboard = navigator.clipboard;

const copyWith = async (writeText: (text: string) => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  const { result } = renderHook(() => useCopyToClipboard());
  await act(async () => {
    result.current.copy(MOCK_TEXT);
  });
  return result;
};

describe(useCopyToClipboard.name, () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
    vi.useRealTimers();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.status).toBe(COPY_STATUS.IDLE);
  });

  it('writes exactly the given text and reports it as copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await copyWith(writeText);

    expect(writeText).toHaveBeenCalledWith(MOCK_TEXT);
    expect(result.current.status).toBe(COPY_STATUS.COPIED);
  });

  it('reports a rejected write as failed', async () => {
    const result = await copyWith(
      vi.fn().mockRejectedValue(new Error('denied')),
    );

    expect(result.current.status).toBe(COPY_STATUS.FAILED);
  });

  it('returns to idle once the reset delay passes', async () => {
    vi.useFakeTimers();
    const result = await copyWith(vi.fn().mockResolvedValue(undefined));

    act(() => {
      vi.advanceTimersByTime(COPY_STATUS_RESET_MS);
    });

    expect(result.current.status).toBe(COPY_STATUS.IDLE);
  });
});
