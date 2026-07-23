import { act, renderHook, waitFor } from '@web/testing/custom-render';

import { useCopyToClipboard } from './use-copy-to-clipboard';

const originalClipboard = navigator.clipboard;
let writeText: ReturnType<typeof vi.fn>;

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

  it('starts with isCopied false', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);
  });

  it('writes the given text to the clipboard and flips isCopied to true', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copy('https://example.com/blog/hello');
    });

    expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
    await waitFor(() => {
      expect(result.current.isCopied).toBe(true);
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

  it('logs and keeps isCopied false when the clipboard write rejects', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      result.current.copy('https://example.com/blog/hello');
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    expect(result.current.isCopied).toBe(false);
  });
});
