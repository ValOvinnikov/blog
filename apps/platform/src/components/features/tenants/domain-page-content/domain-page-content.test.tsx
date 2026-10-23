import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { DomainPageContent } from './domain-page-content';

const THIS_TENANT_IS_ARCHIVED = 'This tenant is archived';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

const getProjectDomainMock = vi.mocked(getProjectDomain);

const render = async (
  tenant = makeTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
) => {
  const ui = await DomainPageContent({ tenant });
  await act(async () => {
    renderWithIntl(ui);
  });
};

describe(`<${DomainPageContent.name}/>`, () => {
  beforeEach(() => {
    getProjectDomainMock.mockReset();
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: '76.76.21.21' }],
    });
  });

  it('shows the title, description and a card skeleton while Vercel has not answered', async () => {
    getProjectDomainMock.mockReturnValue(new Promise(() => {}));

    await render();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Domain' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'The one piece of setup that is genuinely yours to finish.',
      ),
    ).toBeVisible();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  describe('for a live tenant', () => {
    beforeEach(async () => {
      await render();
    });

    it('replaces the skeleton with the domain card once Vercel answers', async () => {
      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: `Point ${MOCK_CUSTOM_DOMAIN} at us`,
        }),
      ).toBeVisible();
      expect(screen.getByText('Awaiting DNS')).toBeVisible();
      expect(screen.queryByTestId('skeleton')).toBeNull();
    });

    it('loads the domain from Vercel exactly once', async () => {
      await screen.findByRole('table');

      expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_CUSTOM_DOMAIN,
      );
    });

    it('does not show the archived notice for a live tenant', () => {
      expect(
        screen.queryByText(THIS_TENANT_IS_ARCHIVED),
      ).not.toBeInTheDocument();
    });
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await render(
      makeTenant({
        primaryDomain: MOCK_CUSTOM_DOMAIN,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      }),
    );

    expect(screen.getByText(THIS_TENANT_IS_ARCHIVED)).toBeVisible();
  });
});
