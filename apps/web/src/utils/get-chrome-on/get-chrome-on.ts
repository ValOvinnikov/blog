import { getThemeTokens } from '@web/utils/get-theme-tokens';

/** Reads the tenant's `chromeOn` flag from the resolved theme tokens. */
export const getChromeOn = async (): Promise<boolean> => {
  const { chromeOn } = await getThemeTokens();
  return chromeOn;
};
