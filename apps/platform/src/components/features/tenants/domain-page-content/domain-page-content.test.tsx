import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { DomainPageContent } from './domain-page-content';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

const getProjectDomainMock = vi.mocked(getProjectDomain);

const render = async (
  tenant = makeTenant({ primaryDomain: 'northwind.dev' }),
) => {
  const ui = await DomainPageContent({ tenant });
  await act(async () => {
    renderWithIntl(ui);
  });
};

describe(DomainPageContent, () => {
  beforeEach(() => {
    getProjectDomainMock.mockReset();
    getProjectDomainMock.mockResolvedValue({
      status: 'PENDING',
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

  it('replaces the skeleton with the domain card once Vercel answers', async () => {
    await render();

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Point northwind.dev at us',
      }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.queryByTestId('skeleton')).toBeNull();
  });

  it('loads the domain from Vercel exactly once', async () => {
    await render();
    await screen.findByRole('table');

    expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
      'northwind.dev',
    );
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await render(
      makeTenant({
        primaryDomain: 'northwind.dev',
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      }),
    );

    expect(screen.getByText('This tenant is archived')).toBeVisible();
  });

  it('does not show the archived notice for a live tenant', async () => {
    await render(
      makeTenant({ primaryDomain: 'northwind.dev', deprovisionedAt: null }),
    );

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });
});
