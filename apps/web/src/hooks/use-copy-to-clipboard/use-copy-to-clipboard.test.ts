/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';

import { useCopyToClipboard } from './use-copy-to-clipboard';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

const COPIED_URL = 'https://example.com/blog/hello';
const WRITE_FAILED_EVENT = 'copy_to_clipboard.write_failed';

const originalClipboard = navigator.clipboard;
let writeText: ReturnType<typeof vi.fn>;

const renderUseCopyToClipboard = () => renderHook(() => useCopyToClipboard());

const setClipboard = (value: unknown) =>
  Object.defineProperty(navigator, 'clipboard', {
    value,
    configurable: true,
  });

describe(useCopyToClipboard, () => {
  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
  });

  afterEach(() => {
    setClipboard(originalClipboard);
  });

  describe('with the default reset delay', () => {
    let result: ReturnType<typeof renderUseCopyToClipboard>['result'];

    beforeEach(() => {
      ({ result } = renderUseCopyToClipboard());
    });

    it('starts with isCopied false', () => {
      expect(result.current.isCopied).toBe(false);
    });

    it('writes the given text to the clipboard and flips isCopied to true', async () => {
      act(() => {
        result.current.copy(COPIED_URL);
      });

      expect(writeText).toHaveBeenCalledWith(COPIED_URL);
      await waitFor(() => {
        expect(result.current.isCopied).toBe(true);
      });
    });

    describe('when the clipboard write rejects', () => {
      const rejection = new Error('denied');

      beforeEach(() => {
        writeText.mockRejectedValue(rejection);
      });

      it('logs and keeps isCopied false when the clipboard write rejects', async () => {
        act(() => {
          result.current.copy(COPIED_URL);
        });

        await waitFor(() => {
          expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            WRITE_FAILED_EVENT,
            { error: rejection },
          );
        });
        expect(result.current.isCopied).toBe(false);
      });

      it('reports the error through the client transport when the clipboard write rejects', async () => {
        act(() => {
          result.current.copy(COPIED_URL);
        });

        await waitFor(() => {
          expect(reportClientErrorMock).toHaveBeenCalledWith(
            WRITE_FAILED_EVENT,
            rejection,
          );
        });
      });
    });
  });

  it('auto-resets isCopied to false after the reset delay', async () => {
    const { result } = renderHook(() => useCopyToClipboard(50));

    act(() => {
      result.current.copy(COPIED_URL);
    });
    await waitFor(() => {
      expect(result.current.isCopied).toBe(true);
    });

    await waitFor(
      () => {
        expect(result.current.isCopied).toBe(false);
      },
      { timeout: 500 },
    );
  });
});
