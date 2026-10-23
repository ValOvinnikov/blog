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

    expect(screen.getByRole('link', { name: 'Read more' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('supports custom link components through as', () => {
    renderElement(
      <LinkButton as={MockLink} href="/about">
        About
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'About' })).toBe(
      screen.getByTestId(MOCK_LINK_TEST_ID),
    );
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'blog-link', children: 'Blog' });

    expect(screen.getByTestId('blog-link')).toBeVisible();
  });
});
