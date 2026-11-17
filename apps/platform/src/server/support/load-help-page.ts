import 'server-only';

import { readHelpOrigin } from '@platform/server/support/read-help-origin';
import { resolveSupportAddress } from '@platform/server/support/support-address';
import { supportEnv } from '@platform/utils/support-env/support-env';

export const loadHelpPage = async (helpPath: string) => ({
  isFormAvailable: Boolean(resolveSupportAddress()),
  originPath: await readHelpOrigin(helpPath),
  helpCentreUrl: supportEnv.HELP_CENTRE_URL,
});
