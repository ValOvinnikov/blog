import {
  mockOperatorViewer,
  mockViewer,
  mockMembership,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { SITE_TYPE } from '@shinefold/config';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  TENANT_STATUS,
} from '@shinefold/db/constants';

import { sampleContentFor } from './sample-content-for';

const ownerViewer = mockViewer();
const blogSite = mockReadyTenant({ siteType: SITE_TYPE.BLOG });

describe(sampleContentFor, () => {
  it('offers removal on a ready site that was seeded with samples', () => {
    expect(sampleContentFor(blogSite, ownerViewer)).toEqual({
      tenantId: MOCK_TENANT_ID,
      isWritable: true,
    });
  });

  it('offers removal to an operator', () => {
    const viewer = mockOperatorViewer(ADMIN_ROLE.ADMIN);

    expect(sampleContentFor(blogSite, viewer)).toMatchObject({
      isWritable: true,
    });
  });

  it('marks a suspended site as not writable', () => {
    const site = mockReadyTenant({
      siteType: SITE_TYPE.BLOG,
      status: TENANT_STATUS.SUSPENDED,
    });

    expect(sampleContentFor(site, ownerViewer)).toMatchObject({
      isWritable: false,
    });
  });

  it.each([
    {
      case: 'a blank site',
      tenant: mockReadyTenant({ siteType: SITE_TYPE.BLANK }),
      viewer: ownerViewer,
    },
    {
      case: 'a site with no recorded type',
      tenant: mockReadyTenant({ siteType: null }),
      viewer: ownerViewer,
    },
    {
      case: 'a site still being set up',
      tenant: mockTenant({ siteType: SITE_TYPE.BLOG }),
      viewer: ownerViewer,
    },
    {
      case: 'an editor',
      tenant: blogSite,
      viewer: mockViewer({
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      }),
    },
  ])('offers nothing for $case', ({ tenant, viewer }) => {
    expect(sampleContentFor(tenant, viewer)).toBeUndefined();
  });
});
