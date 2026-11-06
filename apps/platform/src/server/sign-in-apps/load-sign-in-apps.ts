import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  OAUTH_PROVIDERS,
  SIGN_IN_APPS_MODE,
  type TSignInAppsMode,
} from '@platform/constants/sign-in-apps';
import { maskClientId } from '@platform/utils/mask-client-id/mask-client-id';
import { oauthCallbackUrl } from '@platform/utils/oauth-callback-url/oauth-callback-url';

export type TSignInAppView = {
  provider: TOAuthProvider;
  hasOwnApp: boolean;
  hasKeptApp: boolean;
  callbackUrl: string;
  clientId?: string;
  maskedClientId?: string;
  hasCallbackWarning: boolean;
};

const shownClientId = (mode: TSignInAppsMode, clientId: string) => {
  if (mode === SIGN_IN_APPS_MODE.EDIT) {
    return { clientId, maskedClientId: maskClientId(clientId) };
  }
  if (mode === SIGN_IN_APPS_MODE.READ_ONLY) {
    return { maskedClientId: maskClientId(clientId) };
  }
  return {};
};

export const loadSignInApps = async (
  tenant: TTenant,
  mode: TSignInAppsMode,
): Promise<TSignInAppView[]> => {
  const { id, plan, primaryDomain, deprovisionedAt } = tenant;
  const isEntitled = PLAN_ENTITLEMENTS[plan].hasOwnOAuthApps;
  const clients =
    await queries.tenantOAuthCredentials.listTenantOAuthClients(id);
  const isWarnable =
    !deprovisionedAt &&
    (mode === SIGN_IN_APPS_MODE.EDIT || mode === SIGN_IN_APPS_MODE.READ_ONLY);

  return OAUTH_PROVIDERS.map((provider) => {
    const client: TMaybeUndefined<(typeof clients)[number]> = clients.find(
      (saved) => saved.provider === provider,
    );
    const callbackDomain = client?.callbackDomain ?? primaryDomain;
    const hasOwnApp = Boolean(client) && isEntitled;

    return {
      provider,
      hasOwnApp,
      hasKeptApp: Boolean(client) && !isEntitled,
      callbackUrl: oauthCallbackUrl(primaryDomain, provider),
      hasCallbackWarning:
        isWarnable && hasOwnApp && callbackDomain !== primaryDomain,
      ...(client && hasOwnApp ? shownClientId(mode, client.clientId) : {}),
    };
  });
};
