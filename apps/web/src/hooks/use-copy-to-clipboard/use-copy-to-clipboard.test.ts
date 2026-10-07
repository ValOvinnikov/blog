/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@web/testing/custom-render';
import type { MockInstance } from 'vitest';

import { useCopyToClipboard } from './use-copy-to-clipboard';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

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
        result.current.copy('https://example.com/blog/hello');
      });

      expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
      await waitFor(() => {
        expect(result.current.isCopied).toBe(true);
      });
    });

    describe('when the clipboard write rejects', () => {
      const rejection = new Error('denied');
      let consoleError: MockInstance<typeof console.error>;

      beforeEach(() => {
        writeText.mockRejectedValue(rejection);
        consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
      });

      afterEach(() => {
        consoleError.mockRestore();
      });

      it('logs and keeps isCopied false when the clipboard write rejects', async () => {
        act(() => {
          result.current.copy('https://example.com/blog/hello');
        });

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        });
        expect(result.current.isCopied).toBe(false);
      });

      it('reports the error through the client transport when the clipboard write rejects', async () => {
        act(() => {
          result.current.copy('https://example.com/blog/hello');
        });

        await waitFor(() => {
          expect(reportClientErrorMock).toHaveBeenCalledWith(
            'copy_to_clipboard.write_failed',
            rejection,
          );
        });
      });
    });
  });

  it('auto-resets isCopied to false after the reset delay', async () => {
    const { result } = renderHook(() => useCopyToClipboard(50));

    act(() => {
      result.current.copy('https://example.com/blog/hello');
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
