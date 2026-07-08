import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { TagList } from './tag-list';

faker.seed(123);

const tags = faker.helpers.multiple(() => faker.lorem.word(), { count: 4 });

describe(`<${TagList.name}/>`, () => {
  it('renders all tags as visible elements', () => {
    render(<TagList tags={tags} />);
    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeVisible();
    }
  });

  it('returns null when tags is empty', () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('accepts className override', () => {
    const { container } = render(
      <TagList tags={tags} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('forwards dataTestId', () => {
    render(<TagList tags={tags} dataTestId="tag-list" />);
    expect(screen.getByTestId('tag-list')).toBeVisible();
  });
});
