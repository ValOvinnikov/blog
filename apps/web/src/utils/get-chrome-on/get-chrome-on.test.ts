import { getThemeTokens } from '@web/utils/get-theme-tokens';

import { getChromeOn } from './get-chrome-on';

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: vi.fn(),
}));

describe('getChromeOn', () => {
  it('returns the chromeOn flag from the resolved theme tokens', async () => {
    vi.mocked(getThemeTokens).mockResolvedValue({
      chromeOn: false,
    } as never);

    await expect(getChromeOn()).resolves.toBe(false);
  });

  it('returns true when the resolved theme tokens have chromeOn on', async () => {
    vi.mocked(getThemeTokens).mockResolvedValue({
      chromeOn: true,
    } as never);

    await expect(getChromeOn()).resolves.toBe(true);
  });
});
