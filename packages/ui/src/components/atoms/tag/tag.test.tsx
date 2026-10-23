import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { MOCK_TAG } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { Tag } from './tag';

const setup = customRender(Tag, { children: MOCK_TAG.label });

describe(`<${Tag.name}/>`, () => {
  it('renders a span element', () => {
    setup();
    expect(screen.getByText(MOCK_TAG.label).tagName).toBe('SPAN');
  });

  it('renders as an anchor when `as` is set to "a"', () => {
    renderElement(
      <Tag as="a" href={MOCK_TAG.href}>
        {MOCK_TAG.label}
      </Tag>,
    );
    expect(screen.getByRole('link', { name: MOCK_TAG.label })).toHaveAttribute(
      'href',
      MOCK_TAG.href,
    );
  });

  it('renders with a custom component when `as` prop is provided', () => {
    renderElement(
      <Tag as={MockLink} href={MOCK_TAG.href}>
        {MOCK_TAG.label}
      </Tag>,
    );
    const link = screen.getByRole('link', { name: MOCK_TAG.label });
    expect(link).toBe(screen.getByTestId(MOCK_LINK_TEST_ID));
    expect(link).toHaveAttribute('href', MOCK_TAG.href);
  });
});
