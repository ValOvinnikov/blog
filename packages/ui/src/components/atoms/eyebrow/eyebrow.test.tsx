import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TOPIC } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { Eyebrow } from './eyebrow';

faker.seed(123);

const MOCK_EYEBROW_TEXT = faker.lorem.words(2);

const setup = customRender(Eyebrow, {
  children: MOCK_EYEBROW_TEXT,
});

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    setup();

    const eyebrow = screen.getByText(MOCK_EYEBROW_TEXT);

    expect(eyebrow).toBeVisible();
  });

  it('renders as a link when href is provided', () => {
    setup({ href: MOCK_TOPIC.href, children: MOCK_TOPIC.label });

    const topicLink = screen.getByRole('link', { name: MOCK_TOPIC.label });

    expect(topicLink).toHaveAttribute('href', MOCK_TOPIC.href);
  });

  it('renders the custom link component when href is provided', () => {
    setup({
      href: MOCK_TOPIC.href,
      linkAs: MockLink,
      children: MOCK_TOPIC.label,
    });

    const topicLink = screen.getByRole('link', { name: MOCK_TOPIC.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(topicLink).toBe(mockLink);
  });
});
