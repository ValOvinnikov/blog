import { LOCALE_ISO_CODES, SANITY_PERSPECTIVE } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_POST_HREF,
  MOCK_POST_ID,
  MOCK_POST_SLUG,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getDraftPagePath } from './loader';
import { draftPagePathQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();
const { NL } = LOCALE_ISO_CODES;
const MOCK_RAW_POST = {
  _type: 'page_post',
  path: MOCK_POST_SLUG,
  language: NL,
};

describe(getDraftPagePath, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(MOCK_RAW_POST);
  });

  it("returns the page's href and language", async () => {
    expect(await getDraftPagePath(MOCK_POST_ID, tenant)).toEqual({
      href: MOCK_POST_HREF,
      locale: NL,
    });
  });

  it('reads the id through the drafts perspective, uncached', async () => {
    await getDraftPagePath(MOCK_POST_ID, tenant);

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(draftPagePathQuery, {
      tenant: { ...tenant, perspective: SANITY_PERSPECTIVE.DRAFTS },
      parameters: { id: MOCK_POST_ID },
    });
  });

  it('returns undefined when no page matches', async () => {
    mockRun.mockResolvedValueOnce(null);

    expect(await getDraftPagePath(MOCK_POST_ID, tenant)).toBeUndefined();
  });

  it('returns undefined for a page with no path', async () => {
    mockRun.mockResolvedValueOnce({ ...MOCK_RAW_POST, path: null });

    expect(await getDraftPagePath(MOCK_POST_ID, tenant)).toBeUndefined();
  });
});
