import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { TagList } from './tag-list';

faker.seed(123);

const tags = faker.helpers.multiple(() => faker.lorem.word(), { count: 4 });

describe(`<${TagList.name}/>`, () => {
  it('renders all tags as visible elements', () => {
    render(<TagList tags={tags} />);
    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeVisible();
    }
  });

  it('returns null when tags is empty', () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('accepts className override', () => {
    const { container } = render(
      <TagList tags={tags} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('forwards dataTestId', () => {
    render(<TagList tags={tags} dataTestId="tag-list" />);
    expect(screen.getByTestId('tag-list')).toBeVisible();
  });

  it('renders a tag with an href as a link', () => {
    render(
      <TagList
        tags={[{ label: 'Architecture', href: '/category/architecture' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Architecture' })).toHaveAttribute(
      'href',
      '/category/architecture',
    );
  });

  it('renders a tag without an href as plain text, not a link', () => {
    render(<TagList tags={[{ label: 'Architecture' }]} />);
    expect(screen.getByText('Architecture')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders linked tags using the custom `linkAs` component', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom="true">
        {children}
      </a>
    );
    render(
      <TagList
        tags={[{ label: 'Architecture', href: '/category/architecture' }]}
        linkAs={CustomLink}
      />,
    );
    expect(screen.getByRole('link', { name: 'Architecture' })).toHaveAttribute(
      'data-custom',
      'true',
    );
  });

  it('renders a mix of plain and linked tags from a single array', () => {
    render(
      <TagList
        tags={['Plain', { label: 'Linked', href: '/category/linked' }]}
      />,
    );
    expect(screen.getByText('Plain')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Linked' })).toHaveAttribute(
      'href',
      '/category/linked',
    );
  });
});
