import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TOPIC } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { Eyebrow } from './eyebrow';

const EYEBROW_TEXT = 'Featured Post';

const setup = customRender(Eyebrow, {
  children: EYEBROW_TEXT,
});

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    setup();
    expect(screen.getByText(EYEBROW_TEXT)).toBeVisible();
  });

  it('renders as a <p> element', () => {
    const { container } = setup({ children: 'Label' });
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('renders as a link when href is provided', () => {
    setup({ href: MOCK_TOPIC.href, children: MOCK_TOPIC.label });
    expect(
      screen.getByRole('link', { name: MOCK_TOPIC.label }),
    ).toHaveAttribute('href', MOCK_TOPIC.href);
  });

  it('renders using the custom linkAs component when href is provided', () => {
    setup({
      href: MOCK_TOPIC.href,
      linkAs: MockLink,
      children: MOCK_TOPIC.label,
    });
    expect(screen.getByRole('link', { name: MOCK_TOPIC.label })).toBe(
      screen.getByTestId(MOCK_LINK_TEST_ID),
    );
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'eyebrow' });
    expect(screen.getByTestId('eyebrow')).toBeVisible();
  });
});
