import type { TPendingInviteTenant } from '@blog/auth/providers/magic-link/find-pending-invite-tenants/find-pending-invite-tenants';
import { readRecipientLocale } from '@blog/auth/providers/magic-link/read-recipient-locale/read-recipient-locale';
import type { TResolvedTenantEmailIdentity } from '@blog/auth/providers/magic-link/resolve-tenant-email-identity/resolve-tenant-email-identity';
import type { TMaybeUndefined } from '@blog/config';
import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

// With no tenant behind the host, an invite is written in the invited
// tenant's default language, and a platform admin's own sign-in stays in
// English.
export function resolveRecipientLocale(
  url: string,
  tenantIdentity: TMaybeUndefined<TResolvedTenantEmailIdentity>,
  inviteTenants: TPendingInviteTenant[],
): TLocaleIsoCode {
  if (tenantIdentity) {
    return readRecipientLocale(
      url,
      tenantIdentity.liveLocales,
      tenantIdentity.defaultLocale,
    );
  }

  return inviteTenants[0]?.locale ?? LOCALE_ISO_CODES.EN;
}
