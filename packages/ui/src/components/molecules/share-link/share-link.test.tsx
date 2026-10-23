import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { ShareLink } from './share-link';

const SHARE_LINK_TEST_ID = 'share-link';

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
    setup({ as: MockLink });

    expect(screen.getByTestId(MOCK_LINK_TEST_ID)).toBeVisible();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: SHARE_LINK_TEST_ID });
    expect(screen.getByTestId(SHARE_LINK_TEST_ID)).toBeVisible();
  });
});
