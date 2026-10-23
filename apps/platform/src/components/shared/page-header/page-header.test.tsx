import { render, screen } from '@platform/testing/custom-render';
import { MOCK_SITE_NAME } from '@platform/testing/tenants/fixtures';

import { PageHeader } from './page-header';

describe(`<${PageHeader.name}/>`, () => {
  describe('with only the title', () => {
    beforeEach(() => {
      render(<PageHeader title="Tenants" />);
    });

    it('renders the title through a level-1 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Tenants',
      });

      expect(heading).toBeVisible();
    });

    it('omits the description when not provided', () => {
      const description = screen.queryByText(/every site/i);

      expect(description).not.toBeInTheDocument();
    });

    it('omits the actions container when not provided', () => {
      const actionButton = screen.queryByRole('button');

      expect(actionButton).not.toBeInTheDocument();
    });
  });

  it('renders a description when provided', () => {
    render(
      <PageHeader title="Tenants" description="Every site on the platform." />,
    );
    const description = screen.getByText('Every site on the platform.');

    expect(description).toBeVisible();
  });

  it('renders badges beside the title', () => {
    render(<PageHeader title={MOCK_SITE_NAME} badges={<span>Active</span>} />);
    const heading = screen.getByRole('heading', { level: 1 });
    const badge = screen.getByText('Active');

    expect(heading).toHaveTextContent(MOCK_SITE_NAME);
    expect(badge).toBeVisible();
  });

  it('renders right-aligned actions when provided', () => {
    render(
      <PageHeader
        title="Tenants"
        actions={<button type="button">Add tenant</button>}
      />,
    );
    const addButton = screen.getByRole('button', { name: 'Add tenant' });

    expect(addButton).toBeVisible();
  });

  it('renders with only the required title, without throwing', () => {
    expect(() => render(<PageHeader title="Tenants" />)).not.toThrow();
    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Tenants',
    });

    expect(heading).toBeVisible();
  });
});
