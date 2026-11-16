import type { clearEmailLogoAction as TClearEmailLogoAction } from '@platform/server/email/clear-email-logo-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const clearEmailLogoAction = vi.fn<typeof TClearEmailLogoAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
);
