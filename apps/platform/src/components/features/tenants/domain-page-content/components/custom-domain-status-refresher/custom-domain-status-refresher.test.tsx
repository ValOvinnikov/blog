import { useDomainStatusPoll } from '@platform/components/features/tenants/live-domain-card';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { act, customRender } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { Suspense } from 'react';

import {
  CustomDomainStatusRefresher,
  type TCustomDomainStatusRefresherProps,
} from './custom-domain-status-refresher';

vi.mock('@platform/components/features/tenants/live-domain-card', () => ({
  useDomainStatusPoll: vi.fn(),
}));

vi.mock('@platform/server/custom-domain/get-custom-domain-status-action');

const Harness = (props: TCustomDomainStatusRefresherProps) => (
  <Suspense fallback={null}>
    <CustomDomainStatusRefresher {...props} />
  </Suspense>
);

const INITIAL_STATUS = Promise.resolve(DOMAIN_VERIFICATION_STATUS.PENDING);

const setup = customRender(Harness, {
  tenantId: MOCK_TENANT_ID,
  initialStatus: INITIAL_STATUS,
});

const renderSettled = () =>
  act(async () => {
    setup();
    await INITIAL_STATUS;
  });

describe(`<${CustomDomainStatusRefresher.name}/>`, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
  });

  it('refreshes the page when the polled status differs from the rendered one', async () => {
    vi.mocked(useDomainStatusPoll).mockReturnValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );

    await renderSettled();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh while the polled status is unchanged', async () => {
    vi.mocked(useDomainStatusPoll).mockReturnValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );

    await renderSettled();

    expect(refresh).not.toHaveBeenCalled();
  });
});
