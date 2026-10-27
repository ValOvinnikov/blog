import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  mockClientTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { Suspense } from 'react';

import { LiveDomainCard } from './live-domain-card';

const DOMAIN_POLL_INTERVAL_MS = 10000;

const { getDomainVerificationStatusActionMock } = vi.hoisted(() => ({
  getDomainVerificationStatusActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: getDomainVerificationStatusActionMock,
  }),
);

type TLiveDomainCardProps = Parameters<typeof LiveDomainCard>[0];

const SuspendedLiveDomainCard = (props: TLiveDomainCardProps) => (
  <Suspense>
    <LiveDomainCard {...props} />
  </Suspense>
);

const setup = customRender(SuspendedLiveDomainCard, {
  tenant: mockClientTenant({ id: MOCK_TENANT_ID }),
  domainVerificationStatus: Promise.resolve(
    DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
  ),
  dnsHref: adminRoutes.tenantDomain(MOCK_TENANT_ID),
});

const advancePoll = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
  });
};

describe(`<${LiveDomainCard.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getDomainVerificationStatusActionMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the streamed status, then each status the poll returns', async () => {
    getDomainVerificationStatusActionMock
      .mockResolvedValueOnce(DOMAIN_VERIFICATION_STATUS.PENDING)
      .mockResolvedValueOnce(DOMAIN_VERIFICATION_STATUS.VERIFIED);

    await act(async () => {
      setup();
    });
    const streamedStatus = screen.getByText('Not added yet');

    expect(streamedStatus).toBeVisible();

    await advancePoll();
    const pendingStatus = screen.getByText('Pending — awaiting DNS');

    expect(pendingStatus).toBeVisible();

    await advancePoll();
    const verifiedStatus = screen.getByText('Verified');

    expect(verifiedStatus).toBeVisible();
  });
});
