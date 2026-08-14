import { service } from '@blog/service';

import { getChromeOn } from './get-chrome-on';

vi.mock('@blog/service', () => ({
  service: {
    global: {
      themeSettings: { v1: { getTheme: vi.fn() } },
    },
  },
}));

describe('getChromeOn', () => {
  it('returns the chromeOn flag from the service on success', async () => {
    vi.mocked(service.global.themeSettings.v1.getTheme).mockResolvedValue({
      ok: true,
      data: { chromeOn: false } as never,
    });

    await expect(getChromeOn()).resolves.toBe(false);
  });

  it('falls back to true and logs when the fetch resolves to a failure result', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.global.themeSettings.v1.getTheme).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(getChromeOn()).resolves.toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to load theme settings:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
