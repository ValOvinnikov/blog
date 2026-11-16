import type { uploadEmailLogoAction as TUploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { MOCK_EMAIL_LOGO_URL } from '@platform/testing/email/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';

export const uploadEmailLogoAction = vi.fn<typeof TUploadEmailLogoAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS, url: MOCK_EMAIL_LOGO_URL }),
);
