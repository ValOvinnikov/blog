import { DOMAIN_VERIFICATION_STATUS } from '@blog/config';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';
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

const render = async () => {
  const tenant = makeTenant({ id: 'tenant-1' });
  await act(async () => {
    renderWithIntl(
      <Suspense>
        <LiveDomainCard
          tenant={tenant}
          domainVerificationStatus={Promise.resolve(
            DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
          )}
          dnsHref="/tenants/tenant-1/domain"
        />
      </Suspense>,
    );
  });
};

describe(LiveDomainCard, () => {
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

    await render();
    expect(screen.getByText('Not added yet')).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
    });
    expect(screen.getByText('Pending — awaiting DNS')).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DOMAIN_POLL_INTERVAL_MS);
    });
    expect(screen.getByText('Verified')).toBeVisible();
  });
});
