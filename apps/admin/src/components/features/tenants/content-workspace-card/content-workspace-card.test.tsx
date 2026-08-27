import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { ContentWorkspaceCard } from './content-workspace-card';

const render = renderWithIntl;

describe(ContentWorkspaceCard, () => {
  it("nests the card's title one level under the page's own h1", () => {
    render(<ContentWorkspaceCard tenant={makeTenant()} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Content workspace' }),
    ).toBeVisible();
  });

  it("shows 'Not set' for content-workspace fields the tenant has not been provisioned with yet", () => {
    const tenant = makeTenant({
      sanityProjectId: null,
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      webhookCreatedAt: null,
    });
    render(<ContentWorkspaceCard tenant={tenant} />);

    const notSetTexts = screen.getAllByText('Not set');
    expect(notSetTexts.length).toBeGreaterThan(0);
  });

  it('shows Stored/Active badges once the token and webhook exist', () => {
    const tenant = makeTenant({
      sanityProjectId: 'proj-1',
      sanityDataset: 'production',
      sanityReadTokenEncrypted: 'encrypted-value',
      webhookCreatedAt: new Date('2026-04-02T00:00:00.000Z'),
    });
    render(<ContentWorkspaceCard tenant={tenant} />);

    expect(screen.getByText('Stored')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getByText('proj-1')).toBeVisible();
  });

  it('renders the studio hostname derived from the tenant slug', () => {
    render(<ContentWorkspaceCard tenant={makeTenant({ slug: 'northwind' })} />);

    expect(screen.getByText('studio-northwind.valstack.dev')).toBeVisible();
  });
});
