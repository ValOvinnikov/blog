import { requireEnv } from '../../lib/require-env';

import { TOOL } from './tool';

export type TRecheckEnv = {
  sanityManagementToken: string;
};

export function loadRecheckEnv(): TRecheckEnv {
  return {
    sanityManagementToken: requireEnv(TOOL, 'SANITY_MANAGEMENT_TOKEN'),
  };
}
