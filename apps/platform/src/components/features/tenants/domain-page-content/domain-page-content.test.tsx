import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_VERCEL_A_RECORD,
} from '@platform/testing/tenants/fixtures';

import { DomainPageContent } from './domain-page-content';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

const getProjectDomainMock = vi.mocked(getProjectDomain);

const render = async (
  tenant = mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
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
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  it('shows the title, description and a card skeleton while Vercel has not answered', async () => {
    getProjectDomainMock.mockReturnValue(new Promise(() => {}));

    await render();

    const title = screen.getByRole('heading', { level: 1, name: 'Domain' });
    const description = screen.getByText(
      'The one piece of setup that is genuinely yours to finish.',
    );
    const skeletons = screen.getAllByTestId('skeleton');
    const cardHeading = screen.queryByRole('heading', { level: 2 });

    expect(title).toBeVisible();
    expect(description).toBeVisible();
    expect(skeletons.length).toBeGreaterThan(0);
    expect(cardHeading).toBeNull();
  });

  describe('for a live tenant', () => {
    beforeEach(async () => {
      await render();
    });

    it('replaces the skeleton with the domain card once Vercel answers', async () => {
      const cardHeading = await screen.findByRole('heading', {
        level: 2,
        name: `Point ${MOCK_CUSTOM_DOMAIN} at us`,
      });
      const statusBadge = screen.getByText('Awaiting DNS');
      const skeleton = screen.queryByTestId('skeleton');

      expect(cardHeading).toBeVisible();
      expect(statusBadge).toBeVisible();
      expect(skeleton).toBeNull();
    });

    it('loads the domain from Vercel exactly once', async () => {
      await screen.findByRole('table');

      expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_CUSTOM_DOMAIN,
      );
    });

    it('does not show the archived notice for a live tenant', () => {
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);

      expect(archivedNotice).not.toBeInTheDocument();
    });
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await render(
      mockTenant({
        primaryDomain: MOCK_CUSTOM_DOMAIN,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      }),
    );

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });
});
