import { ACTION_OUTCOME } from '@blog/config';
import type { uploadEmailLogoAction as TUploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { MOCK_EMAIL_LOGO_URL } from '@platform/testing/email/fixtures';

export const uploadEmailLogoAction = vi.fn<typeof TUploadEmailLogoAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS, url: MOCK_EMAIL_LOGO_URL }),
);
