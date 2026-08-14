import { service } from '@blog/service';

/**
 * Fetches the tenant's `chromeOn` theme flag, falling back to `true` (the
 * console preset's chrome-wrapped composition, this app's existing
 * behavior) on failure — swapping to the plain fallback composition is a
 * presentational choice, never worth a hard failure.
 */
export async function getChromeOn(): Promise<boolean> {
  const result = await service.global.themeSettings.v1.getTheme();

  if (!result.ok) {
    console.error('Failed to load theme settings:', result.error);
    return true;
  }

  return result.data.chromeOn;
}
