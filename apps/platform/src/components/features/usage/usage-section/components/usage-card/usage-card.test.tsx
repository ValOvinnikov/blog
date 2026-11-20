import { USAGE_METER } from '@platform/constants/usage';
import { loadUsageMeters } from '@platform/server/usage/load-usage-meters';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { MOCK_MARKETING_SITE_URL } from '@platform/testing/tenants/tenant-identity';
import {
  MOCK_USAGE_NOW,
  MOCK_USAGE_RESETS_ON,
  mockUsageMeterRow,
} from '@platform/testing/usage/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { pricingPageUrl } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';

import { UsageCard } from './usage-card';

vi.mock('@platform/server/usage/load-usage-meters');
vi.mock('@platform/utils/env/env');

const t = makeEnTranslator('usageCard');
const LANGUAGES_HREF = adminRoutes.dashboardLanguages();
const TAKEAWAYS_LABEL = t(`labels.${USAGE_METER.TAKEAWAYS}`);
const SEATS_LABEL = t(`labels.${USAGE_METER.SEATS}`);
const RESETS_ON_NOTE = `Resets on ${MOCK_USAGE_RESETS_ON}`;
const VALUE_NOW = 'aria-valuenow';
const PLANS_LINK = { name: t('footer.plansLink') };

const setup = customRenderAsync(UsageCard, {
  tenant: mockTenant(),
  languagesHref: LANGUAGES_HREF,
});

describe(`<${UsageCard.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_USAGE_NOW);
    mockedEnv.MARKETING_SITE_URL = MOCK_MARKETING_SITE_URL;
    vi.mocked(loadUsageMeters).mockResolvedValue([mockUsageMeterRow()]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with an under-limit meter', () => {
    beforeEach(async () => {
      await setup();
    });

    it('shows the meter as used of allowance with the reset date', () => {
      const title = screen.getByRole('heading', { level: 2, name: t('title') });
      const meter = screen.getByRole('meter', { name: TAKEAWAYS_LABEL });
      const allowance = screen.getByText('of 20');
      const note = screen.getByText(RESETS_ON_NOTE);

      expect(title).toBeVisible();
      expect(meter).toHaveAttribute(VALUE_NOW, '2');
      expect(allowance).toBeVisible();
      expect(note).toBeVisible();
    });

    it('leaves the footer out when the view does not ask for it', () => {
      const plansLink = screen.queryByRole('link', PLANS_LINK);

      expect(plansLink).not.toBeInTheDocument();
    });
  });

  it('warns how much is left once a monthly meter is near its limit', async () => {
    vi.mocked(loadUsageMeters).mockResolvedValue([
      mockUsageMeterRow({ reading: { used: 17, allowance: 20 } }),
    ]);

    await setup();

    const warning = screen.getByText('85% used — 3 left');
    const note = screen.getByText(RESETS_ON_NOTE);

    expect(warning).toBeVisible();
    expect(note).toBeVisible();
  });

  it('caps a used-up monthly meter at its allowance and says when it resets', async () => {
    vi.mocked(loadUsageMeters).mockResolvedValue([
      mockUsageMeterRow({ reading: { used: 23, allowance: 20 } }),
    ]);

    await setup();

    const meter = screen.getByRole('meter', { name: TAKEAWAYS_LABEL });
    const note = screen.getByText(
      `All used. New posts get no takeaways until ${MOCK_USAGE_RESETS_ON}.`,
    );

    expect(meter).toHaveAttribute(VALUE_NOW, '20');
    expect(note).toBeVisible();
  });

  it('shows the failed state for a row whose read failed and keeps the others', async () => {
    vi.mocked(loadUsageMeters).mockResolvedValue([
      mockUsageMeterRow(),
      mockUsageMeterRow({
        meter: USAGE_METER.SEATS,
        reading: undefined,
        isMonthly: false,
      }),
    ]);

    await setup();

    const seatsLabel = screen.getByText(SEATS_LABEL);
    const failed = screen.getByText(t('failed'));
    const seatsMeter = screen.queryByRole('meter', { name: SEATS_LABEL });
    const takeawaysMeter = screen.getByRole('meter', { name: TAKEAWAYS_LABEL });

    expect(seatsLabel).toBeVisible();
    expect(failed).toBeVisible();
    expect(seatsMeter).not.toBeInTheDocument();
    expect(takeawaysMeter).toBeVisible();
  });

  it('links the languages row and marks a granted allowance', async () => {
    vi.mocked(loadUsageMeters).mockResolvedValue([
      mockUsageMeterRow({
        meter: USAGE_METER.LANGUAGES,
        reading: { used: 1, allowance: 2 },
        isMonthly: false,
        href: LANGUAGES_HREF,
        grant: { expiresAt: null },
      }),
    ]);

    await setup();

    const link = screen.getByRole('link', {
      name: t(`links.${USAGE_METER.LANGUAGES}`),
    });
    const badge = screen.getByText(makeEnTranslator('grantedBadge')('label'));

    expect(link).toHaveAttribute('href', LANGUAGES_HREF);
    expect(badge).toBeVisible();
  });

  it('links the plan comparison in the footer on a Free site that asks for it', async () => {
    await setup({ hasPlansFooter: true });

    const plansLink = screen.getByRole('link', PLANS_LINK);

    expect(plansLink).toHaveAttribute(
      'href',
      pricingPageUrl(MOCK_MARKETING_SITE_URL),
    );
  });

  it('leaves the footer out on a Growth site', async () => {
    await setup({
      tenant: mockTenant({ plan: TENANT_PLAN.GROWTH }),
      hasPlansFooter: true,
    });

    const plansLink = screen.queryByRole('link', PLANS_LINK);

    expect(plansLink).not.toBeInTheDocument();
  });
});
