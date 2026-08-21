import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { TaxonomyCard } from './taxonomy-card';

faker.seed(123);

const setup = customRender(TaxonomyCard, {
  title: faker.lorem.words(2),
  href: `/topics/${faker.lorem.slug()}`,
  postCountLabel: '5 posts',
  headingLevel: 2 as const,
});

describe(`<${TaxonomyCard.name}/>`, () => {
  it('renders the title as a heading at the given level, linking to href', () => {
    const title = faker.lorem.words(3);
    const href = `/topics/${faker.lorem.slug()}`;
    setup({ title, href, headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3 });
    const link = screen.getByRole('link');
    expect(heading).toContainElement(link);
    expect(link).toHaveAttribute('href', href);
  });

  it('renders description when provided', () => {
    setup({ description: 'Posts about building things.' });
    expect(screen.getByText('Posts about building things.')).toBeVisible();
  });

  it('does not render a description element when omitted', () => {
    setup();
    expect(screen.queryByText(/posts about/i)).not.toBeInTheDocument();
  });

  it('renders the pre-formatted post count label as visible text', () => {
    setup({ postCountLabel: '1 post' });
    expect(screen.getByText('1 post')).toBeVisible();
  });

  it("composes the link's accessible name from the visible title followed by the post count", () => {
    setup({ title: 'Engineering', postCountLabel: '5 posts' });
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('Engineering, 5 posts');
  });

  it('honours a custom accessibleNameSeparator when composing the accessible name', () => {
    setup({
      title: 'Engineering',
      postCountLabel: '5 posts',
      accessibleNameSeparator: ' — ',
    });
    expect(
      screen.getByRole('link', { name: 'Engineering — 5 posts' }),
    ).toBeVisible();
  });

  it('renders the link via the linkAs component when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );
    setup({ linkAs: CustomLink });

    expect(screen.getByTestId('custom-link')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'taxonomy-card' });
    expect(screen.getByTestId('taxonomy-card')).toBeVisible();
  });

  it('merges extra className onto the root element', () => {
    setup({ className: 'mt-4', dataTestId: 'taxonomy-card' });
    expect(screen.getByTestId('taxonomy-card').className).toContain('mt-4');
  });
});
