import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TAG } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';

import { Tag } from './tag';

describe(`<${Tag.name}/>`, () => {
  it('renders as a link to href when as is "a"', () => {
    renderElement(
      <Tag as="a" href={MOCK_TAG.href}>
        {MOCK_TAG.label}
      </Tag>,
    );

    const tagLink = screen.getByRole('link', { name: MOCK_TAG.label });

    expect(tagLink).toHaveAttribute('href', MOCK_TAG.href);
  });

  it('renders through a custom component given as the as prop', () => {
    renderElement(
      <Tag as={MockLink} href={MOCK_TAG.href}>
        {MOCK_TAG.label}
      </Tag>,
    );

    const tagLink = screen.getByRole('link', { name: MOCK_TAG.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(tagLink).toBe(mockLink);
    expect(tagLink).toHaveAttribute('href', MOCK_TAG.href);
  });
});
