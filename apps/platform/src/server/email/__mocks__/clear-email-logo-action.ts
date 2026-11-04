import { ACTION_OUTCOME } from '@blog/config';
import type { clearEmailLogoAction as TClearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';

export const clearEmailLogoAction = vi.fn<typeof TClearEmailLogoAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
);
