import { LANGUAGE_SWITCHER_STYLE } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';

import { getLanguageSwitcherStyle } from './get-language-switcher-style';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));
vi.mock('@web/utils/logger/logger');

const getSiteConfigMock = vi.mocked(getSiteConfig);

describe(getLanguageSwitcherStyle, () => {
  it("returns the tenant's saved style", async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES },
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.CODES,
    );
  });

  it('falls back to the menu with code when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });

  it('falls back to the menu with code when the site config read fails', async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: false,
      error: new Error('down'),
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });
});
