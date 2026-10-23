import { LANGUAGE_SWITCHER_STYLE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';

import { getLanguageSwitcherStyle } from './get-language-switcher-style';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

const getSiteConfigMock = vi.mocked(getSiteConfig);

describe(getLanguageSwitcherStyle, () => {
  it("returns the tenant's saved style", async () => {
    getSiteConfigMock.mockResolvedValue(
      okResult({
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      }) as Awaited<ReturnType<typeof getSiteConfig>>,
    );

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.CODES,
    );
  });

  it('falls back to the menu with code when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(okResult());

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });

  it('falls back to the menu with code when the site config read fails', async () => {
    getSiteConfigMock.mockResolvedValue(
      errorResult(new Error('down')) as Awaited<
        ReturnType<typeof getSiteConfig>
      >,
    );

    await expect(getLanguageSwitcherStyle('tenant-a')).resolves.toBe(
      LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    );
  });
});
