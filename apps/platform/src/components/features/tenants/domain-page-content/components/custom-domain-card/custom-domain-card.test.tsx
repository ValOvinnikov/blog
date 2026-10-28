import { TENANT_PLAN } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { getCustomDomainStatusAction } from '@platform/server/custom-domain/get-custom-domain-status-action';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_VERCEL_A_RECORD,
} from '@platform/testing/tenants/fixtures';
import { requestCustomDomainCardFocus } from '@platform/utils/custom-domain-focus/custom-domain-focus';

import {
  CustomDomainCard,
  type TCustomDomainCardProps,
} from './custom-domain-card';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

vi.mock('@platform/server/custom-domain/get-custom-domain-status-action');
vi.mock('@platform/server/custom-domain/connect-custom-domain-action');
vi.mock('@platform/server/custom-domain/remove-custom-domain-action');

const { ownDomain } = en.tenantDomainPage;
const POLL_INTERVAL_MS = 10_000;
const TITLE = { level: 2, name: ownDomain.title };

const BASE_PROPS: TCustomDomainCardProps = {
  tenant: {
    id: MOCK_TENANT_ID,
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: null,
    primaryDomain: MOCK_TENANT_DOMAIN,
  },
  customDomain: undefined,
  isPrimaryCustom: false,
  primaryProjectDomain: Promise.resolve({
    status: DOMAIN_VERIFICATION_STATUS.PENDING,
    dnsRecords: [],
  }),
  canManage: true,
};

const setup = customRender(CustomDomainCard, BASE_PROPS);

describe(`<${CustomDomainCard.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getCustomDomainStatusAction).mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );
    vi.mocked(getProjectDomain).mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderCard = (props: Partial<TCustomDomainCardProps>) =>
    act(async () => {
      setup(props);
    });

  const pollOnce = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
  };

  it('polls the custom domain of a live site', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });
    await screen.findByRole('heading', TITLE);

    await pollOnce();

    expect(getCustomDomainStatusAction).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('does not poll the custom domain of an archived site', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await renderCard({
      customDomain: MOCK_CUSTOM_DOMAIN,
      tenant: { ...BASE_PROPS.tenant, deprovisionedAt: MOCK_ARCHIVED_AT },
    });
    await screen.findByRole('heading', TITLE);

    await pollOnce();

    expect(getCustomDomainStatusAction).not.toHaveBeenCalled();
  });

  it('offers Remove only to someone who can manage the site', async () => {
    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN, canManage: false });
    await screen.findByRole('heading', TITLE);

    const remove = screen.queryByRole('button', { name: ownDomain.remove });

    expect(remove).not.toBeInTheDocument();
  });

  it('shows a custom main address read-only, with no form and no Remove', async () => {
    await renderCard({ isPrimaryCustom: true });
    await screen.findByRole('heading', TITLE);

    const remove = screen.queryByRole('button', { name: ownDomain.remove });
    const input = screen.queryByRole('textbox');

    expect(remove).not.toBeInTheDocument();
    expect(input).not.toBeInTheDocument();
  });

  it('tells a member who cannot manage the site that only the owner can connect', () => {
    setup({ canManage: false });

    const message = screen.getByText(ownDomain.ownerOnly);
    const input = screen.queryByRole('textbox');

    expect(message).toBeVisible();
    expect(input).not.toBeInTheDocument();
  });

  it('moves focus to the card heading after an action asked for it', async () => {
    requestCustomDomainCardFocus();

    await renderCard({ customDomain: MOCK_CUSTOM_DOMAIN });

    const heading = await screen.findByRole('heading', TITLE);
    expect(heading).toHaveFocus();
  });
});
