import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { ShareLink } from './share-link';

faker.seed(123);

const setup = customRender(ShareLink, {
  href: faker.internet.url(),
  label: faker.lorem.words(2),
});

describe(`<${ShareLink.name}/>`, () => {
  it('renders a link to the given href, as a plain <a> by default', () => {
    const href = faker.internet.url();
    const label = faker.lorem.words(2);
    setup({ href, label });

    const link = screen.getByRole('link', { name: label });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the given icon alongside the label', () => {
    setup({ icon: <svg data-testid="share-icon" /> });

    expect(screen.getByTestId('share-icon')).toBeVisible();
  });

  it('renders via the as prop when provided', () => {
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

    setup({ as: CustomLink });

    expect(screen.getByTestId('custom-link')).toBeVisible();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'share-link' });
    expect(screen.getByTestId('share-link')).toBeVisible();
  });

  it('merges extra className', () => {
    setup({ className: 'mt-4', dataTestId: 'share-link' });
    expect(screen.getByTestId('share-link').className).toContain('mt-4');
  });
});
