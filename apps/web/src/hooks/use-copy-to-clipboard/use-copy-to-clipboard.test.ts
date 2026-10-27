/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import { act, renderHook } from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';

import { useCopyToClipboard } from './use-copy-to-clipboard';

vi.mock('@web/utils/report-client-error');

faker.seed(6012);

const MOCK_COPIED_URL = faker.internet.url();
const MOCK_RESET_MS = faker.number.int({ min: 100, max: 900 });
const MOCK_REJECTION = new Error(faker.lorem.sentence());
const WRITE_FAILED_EVENT = 'copy_to_clipboard.write_failed';

const originalClipboard = navigator.clipboard;
let writeText: ReturnType<typeof vi.fn>;

const setClipboard = (value: unknown) =>
  Object.defineProperty(navigator, 'clipboard', {
    value,
    configurable: true,
  });

describe(useCopyToClipboard, () => {
  let result: ReturnType<
    typeof renderHook<ReturnType<typeof useCopyToClipboard>, unknown>
  >['result'];

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    ({ result } = renderHook(() => useCopyToClipboard(MOCK_RESET_MS)));
  });

  afterEach(() => {
    vi.useRealTimers();
    setClipboard(originalClipboard);
  });

  it('starts as not copied', () => {
    expect(result.current.isCopied).toBe(false);
  });

  it('writes the given text to the clipboard and reports it as copied', async () => {
    await act(async () => {
      result.current.copy(MOCK_COPIED_URL);
    });

    expect(writeText).toHaveBeenCalledWith(MOCK_COPIED_URL);
    expect(result.current.isCopied).toBe(true);
  });

  it('reports not copied again once the reset delay has passed', async () => {
    await act(async () => {
      result.current.copy(MOCK_COPIED_URL);
    });

    act(() => {
      vi.advanceTimersByTime(MOCK_RESET_MS - 1);
    });
    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isCopied).toBe(false);
  });

  describe('when the clipboard write rejects', () => {
    beforeEach(async () => {
      writeText.mockRejectedValue(MOCK_REJECTION);

      await act(async () => {
        result.current.copy(MOCK_COPIED_URL);
      });
    });

    it('logs the failure and stays not copied', () => {
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(WRITE_FAILED_EVENT, {
        error: MOCK_REJECTION,
      });
      expect(result.current.isCopied).toBe(false);
    });

    it('reports the failure through the client transport', () => {
      expect(vi.mocked(reportClientError)).toHaveBeenCalledWith(
        WRITE_FAILED_EVENT,
        MOCK_REJECTION,
      );
    });
  });
});
