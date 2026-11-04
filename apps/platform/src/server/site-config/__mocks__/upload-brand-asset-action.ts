import { ACTION_OUTCOME } from '@blog/config';
import type { uploadBrandAssetAction as TUploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { MOCK_UPLOADED_LOGO_URL } from '@platform/testing/site-config/fixtures';

export const uploadBrandAssetAction = vi.fn<typeof TUploadBrandAssetAction>(
  async () => ({
    outcome: ACTION_OUTCOME.SUCCESS,
    url: MOCK_UPLOADED_LOGO_URL,
  }),
);
