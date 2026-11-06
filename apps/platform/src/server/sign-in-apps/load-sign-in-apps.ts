import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';
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
  const { id, primaryDomain, deprovisionedAt } = tenant;
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

    return {
      provider,
      hasOwnApp: Boolean(client),
      callbackUrl: oauthCallbackUrl(primaryDomain, provider),
      hasCallbackWarning:
        isWarnable && Boolean(client) && callbackDomain !== primaryDomain,
      ...(client ? shownClientId(mode, client.clientId) : {}),
    };
  });
};
