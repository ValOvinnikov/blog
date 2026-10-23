import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TAG } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { TagList } from './tag-list';

const LINKED_HREF = '/topics/linked';

faker.seed(123);

const tags = faker.helpers.multiple(() => faker.lorem.word(), { count: 4 });

const setup = customRender(TagList, { tags });

describe(`<${TagList.name}/>`, () => {
  it('renders all tags as visible elements', () => {
    setup();
    for (const tag of tags) {
      const tagElement = screen.getByText(tag);
      expect(tagElement).toBeVisible();
    }
  });

  it('returns null when tags is empty', () => {
    const { container } = setup({ tags: [] });
    expect(container.firstChild).toBeNull();
  });

  it('forwards dataTestId', () => {
    setup({ dataTestId: 'tag-list' });
    const tagList = screen.getByTestId('tag-list');
    expect(tagList).toBeVisible();
  });

  it('renders a tag without an href as plain text, not a link', () => {
    setup({ tags: [{ label: MOCK_TAG.label }] });
    const plainTag = screen.getByText(MOCK_TAG.label);
    const link = screen.queryByRole('link');
    expect(plainTag).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('renders linked tags using the custom `linkAs` component', () => {
    setup({
      tags: [MOCK_TAG],
      linkAs: MockLink,
    });
    const tagLink = screen.getByRole('link', { name: MOCK_TAG.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);
    expect(tagLink).toBe(mockLink);
  });

  it('renders a mix of plain and linked tags from a single array', () => {
    setup({
      tags: ['Plain', { label: 'Linked', href: LINKED_HREF }],
    });
    const plainTag = screen.getByText('Plain');
    const linkedTag = screen.getByRole('link', { name: 'Linked' });
    expect(plainTag).toBeVisible();
    expect(linkedTag).toHaveAttribute('href', LINKED_HREF);
  });
});
