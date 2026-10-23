import { urlForSanityImage } from '@blog/service';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

export const MOCK_OG_IMAGE = mockSanityImage();

export const MOCK_OG_IMAGE_URL = urlForSanityImage(
  MOCK_OG_IMAGE,
  MOCK_TENANT_SANITY_CONTEXT,
);
