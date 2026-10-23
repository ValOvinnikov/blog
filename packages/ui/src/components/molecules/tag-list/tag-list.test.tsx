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
      expect(screen.getByText(tag)).toBeVisible();
    }
  });

  it('returns null when tags is empty', () => {
    const { container } = setup({ tags: [] });
    expect(container.firstChild).toBeNull();
  });

  it('forwards dataTestId', () => {
    setup({ dataTestId: 'tag-list' });
    expect(screen.getByTestId('tag-list')).toBeVisible();
  });

  it('renders a tag without an href as plain text, not a link', () => {
    setup({ tags: [{ label: MOCK_TAG.label }] });
    expect(screen.getByText(MOCK_TAG.label)).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders linked tags using the custom `linkAs` component', () => {
    setup({
      tags: [MOCK_TAG],
      linkAs: MockLink,
    });
    expect(screen.getByRole('link', { name: MOCK_TAG.label })).toBe(
      screen.getByTestId(MOCK_LINK_TEST_ID),
    );
  });

  it('renders a mix of plain and linked tags from a single array', () => {
    setup({
      tags: ['Plain', { label: 'Linked', href: LINKED_HREF }],
    });
    expect(screen.getByText('Plain')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Linked' })).toHaveAttribute(
      'href',
      LINKED_HREF,
    );
  });
});
