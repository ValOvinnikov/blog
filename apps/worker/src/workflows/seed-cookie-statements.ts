import type { TLocaleIsoCode } from '@blog/config/constants';
import { ensureCookieStatementsSeeded } from '@worker/units/ensure-cookie-statements-seeded';

export async function seedCookieStatements(
  tenantId: string,
  locales: TLocaleIsoCode[],
): Promise<void> {
  'use workflow';

  await ensureCookieStatementsSeeded(tenantId, locales);
}
