import { render, screen } from '@admin/testing/custom-render';

import { PageHeader } from './page-header';

describe(PageHeader, () => {
  it('renders the title through a level-1 heading', () => {
    render(<PageHeader title="Tenants" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tenants' }),
    ).toBeVisible();
  });

  it('renders a description when provided', () => {
    render(
      <PageHeader title="Tenants" description="Every site on the platform." />,
    );
    expect(screen.getByText('Every site on the platform.')).toBeVisible();
  });

  it('omits the description when not provided', () => {
    render(<PageHeader title="Tenants" />);
    expect(screen.queryByText(/every site/i)).toBeNull();
  });

  it('renders badges beside the title', () => {
    render(
      <PageHeader title="Northwind Field Notes" badges={<span>Active</span>} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Northwind Field Notes',
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

  it('omits the actions container when not provided', () => {
    render(<PageHeader title="Tenants" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders with only the required title, without throwing', () => {
    expect(() => render(<PageHeader title="Tenants" />)).not.toThrow();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tenants' }),
    ).toBeVisible();
  });

  it('merges a caller-supplied className', () => {
    const { container } = render(
      <PageHeader title="Tenants" className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
