import {
  CAPABILITY,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { MOCK_DEPROVISIONED_AT } from '@shinefold/db/testing/tenants/fixtures';

import {
  newsletterSendingOffCause,
  type TNewsletterSendingSettings,
} from './newsletter-sending-off-cause';

const MOCK_ACTIVE_TENANT = {
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
};
const MOCK_SENDING_SETTINGS: TNewsletterSendingSettings = {
  capabilities: [CAPABILITY.NEWSLETTER],
  newsletterEnabled: true,
  emailNewPosts: true,
};
const MOCK_ALL_OFF_SETTINGS: TNewsletterSendingSettings = {
  capabilities: [],
  newsletterEnabled: false,
  emailNewPosts: false,
};

describe(newsletterSendingOffCause, () => {
  it('names no cause for a site that sends posts', () => {
    expect(
      newsletterSendingOffCause(MOCK_ACTIVE_TENANT, MOCK_SENDING_SETTINGS),
    ).toBeUndefined();
  });

  it.each([
    [
      NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
      { status: TENANT_STATUS.SUSPENDED, deprovisionedAt: null },
      MOCK_ALL_OFF_SETTINGS,
    ],
    [
      NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
      { status: TENANT_STATUS.ARCHIVED, deprovisionedAt: null },
      { ...MOCK_ALL_OFF_SETTINGS, capabilities: [CAPABILITY.NEWSLETTER] },
    ],
    [
      NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
      { status: TENANT_STATUS.ACTIVE, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      MOCK_SENDING_SETTINGS,
    ],
    [
      NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
      MOCK_ACTIVE_TENANT,
      {
        ...MOCK_SENDING_SETTINGS,
        newsletterEnabled: false,
        emailNewPosts: false,
      },
    ],
    [
      NEWSLETTER_SKIP_REASON.SENDING_OFF,
      MOCK_ACTIVE_TENANT,
      { ...MOCK_SENDING_SETTINGS, emailNewPosts: false },
    ],
  ])('names %s as the first cause that applies', (cause, tenant, settings) => {
    expect(newsletterSendingOffCause(tenant, settings)).toBe(cause);
  });
});
