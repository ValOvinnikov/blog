import { getThemeTokens } from './get-theme-tokens';

/** Reads the tenant's `chromeOn` flag from the resolved theme tokens. */
export async function getChromeOn(): Promise<boolean> {
  const { chromeOn } = await getThemeTokens();
  return chromeOn;
}
