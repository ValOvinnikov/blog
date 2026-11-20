import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';

export const stubStagedImageUrl = () =>
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
