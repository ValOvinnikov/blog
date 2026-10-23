import { render, screen } from '@platform/testing/custom-render';
import { MOCK_SITE_NAME } from '@platform/testing/tenants/fixtures';

import { PageHeader } from './page-header';

describe(`<${PageHeader.name}/>`, () => {
  describe('with only the title', () => {
    beforeEach(() => {
      render(<PageHeader title="Tenants" />);
    });

    it('renders the title through a level-1 heading', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Tenants' }),
      ).toBeVisible();
    });

    it('omits the description when not provided', () => {
      expect(screen.queryByText(/every site/i)).toBeNull();
    });

    it('omits the actions container when not provided', () => {
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  it('renders a description when provided', () => {
    render(
      <PageHeader title="Tenants" description="Every site on the platform." />,
    );
    expect(screen.getByText('Every site on the platform.')).toBeVisible();
  });

  it('renders badges beside the title', () => {
    render(<PageHeader title={MOCK_SITE_NAME} badges={<span>Active</span>} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      MOCK_SITE_NAME,
    );
    expect(screen.getByText('Active')).toBeVisible();
  });

  it('renders right-aligned actions when provided', () => {
    render(
      <PageHeader
        title="Tenants"
        actions={<button type="button">Add tenant</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add tenant' })).toBeVisible();
  });

  it('renders with only the required title, without throwing', () => {
    expect(() => render(<PageHeader title="Tenants" />)).not.toThrow();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tenants' }),
    ).toBeVisible();
  });
});
