import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TAG } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { TagList } from './tag-list';

faker.seed(123);

const MOCK_LINKED_HREF = `/topics/${faker.lorem.slug()}`;
const MOCK_PLAIN_LABEL = faker.lorem.word();
const MOCK_LINKED_LABEL = faker.lorem.word();

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

  it('renders nothing when there are no tags', () => {
    const { container } = setup({ tags: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a tag without an href as plain text, not a link', () => {
    setup({ tags: [{ label: MOCK_TAG.label }] });

    const plainTag = screen.getByText(MOCK_TAG.label);
    const link = screen.queryByRole('link');

    expect(plainTag).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('renders linked tags through the supplied link component', () => {
    setup({ tags: [MOCK_TAG], linkAs: MockLink });

    const tagLink = screen.getByRole('link', { name: MOCK_TAG.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(tagLink).toBe(mockLink);
  });

  it('renders a mix of plain and linked tags from a single array', () => {
    setup({
      tags: [
        MOCK_PLAIN_LABEL,
        { label: MOCK_LINKED_LABEL, href: MOCK_LINKED_HREF },
      ],
    });

    const plainTag = screen.getByText(MOCK_PLAIN_LABEL);
    const linkedTag = screen.getByRole('link', { name: MOCK_LINKED_LABEL });

    expect(plainTag).toBeVisible();
    expect(linkedTag).toHaveAttribute('href', MOCK_LINKED_HREF);
  });
});
