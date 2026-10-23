import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TOPIC } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { Eyebrow } from './eyebrow';

const EYEBROW_TEXT = 'Featured Post';
const EYEBROW_TEST_ID = 'eyebrow';

const setup = customRender(Eyebrow, {
  children: EYEBROW_TEXT,
});

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    setup();
    const eyebrow = screen.getByText(EYEBROW_TEXT);
    expect(eyebrow).toBeVisible();
  });

  it('renders as a <p> element', () => {
    const { container } = setup({ children: 'Label' });
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('renders as a link when href is provided', () => {
    setup({ href: MOCK_TOPIC.href, children: MOCK_TOPIC.label });
    const topicLink = screen.getByRole('link', { name: MOCK_TOPIC.label });
    expect(topicLink).toHaveAttribute('href', MOCK_TOPIC.href);
  });

  it('renders using the custom linkAs component when href is provided', () => {
    setup({
      href: MOCK_TOPIC.href,
      linkAs: MockLink,
      children: MOCK_TOPIC.label,
    });
    const topicLink = screen.getByRole('link', { name: MOCK_TOPIC.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);
    expect(topicLink).toBe(mockLink);
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: EYEBROW_TEST_ID });
    const eyebrow = screen.getByTestId(EYEBROW_TEST_ID);
    expect(eyebrow).toBeVisible();
  });
});
