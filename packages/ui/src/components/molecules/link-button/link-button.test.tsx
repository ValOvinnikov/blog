import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { LinkButton } from './link-button';

const setup = customRender(LinkButton, {
  href: '/blog',
  children: 'Read more',
});

describe(`<${LinkButton.name}/>`, () => {
  it('renders an anchor by default', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Read more' });

    expect(link).toHaveAttribute('href', '/blog');
  });

  it('supports custom link components through as', () => {
    renderElement(
      <LinkButton as={MockLink} href="/about">
        About
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'About' });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(link).toBe(mockLink);
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'blog-link', children: 'Blog' });

    const link = screen.getByTestId('blog-link');

    expect(link).toBeVisible();
  });
});
