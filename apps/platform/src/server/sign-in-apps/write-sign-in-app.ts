import 'server-only';

import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';

type TWriteSignInAppInput = {
  provider: TOAuthProvider;
  clientId: string;
  clientSecret?: string;
  callbackDomain: string;
};

export const writeSignInApp = async (
  tenantId: string,
  { clientSecret, ...client }: TWriteSignInAppInput,
): Promise<boolean> => {
  if (!clientSecret) {
    return queries.tenantOAuthCredentials.updateTenantOAuthClient(
      tenantId,
      client,
    );
  }

  await queries.tenantOAuthCredentials.saveTenantOAuthCredentials(tenantId, {
    ...client,
    clientSecret,
  });
  return true;
};
