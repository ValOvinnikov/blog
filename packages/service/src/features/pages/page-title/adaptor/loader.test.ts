import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPageTitle } from './loader';

vi.mock('@blog/service/sanity/query/query');

const tenant = makeTenant();
const PAGE_ID = 'landing-pricing';
const PAGE_TITLE = 'Our pricing';

describe(getPageTitle, () => {
  it("returns the page's title", async () => {
    mockRun.mockResolvedValueOnce({ title: PAGE_TITLE });

    expect(await getPageTitle(PAGE_ID, tenant)).toBe(PAGE_TITLE);
  });

  it('returns undefined when no page matches', async () => {
    mockRun.mockResolvedValueOnce(null);

    expect(await getPageTitle(PAGE_ID, tenant)).toBeUndefined();
  });

  it('reads the id under the tags the webhook purges for home and landing pages', async () => {
    mockRun.mockResolvedValueOnce({ title: PAGE_TITLE });

    await getPageTitle(PAGE_ID, tenant);

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        parameters: { id: PAGE_ID },
        next: expect.objectContaining({
          tags: [
            `t:${tenant.projectId}:homePage`,
            `t:${tenant.projectId}:page_landing`,
          ],
        }),
      }),
    );
  });
});
