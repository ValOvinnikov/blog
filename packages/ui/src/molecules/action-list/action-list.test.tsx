import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { ActionList } from './action-list';

faker.seed(123);

const label = faker.lorem.words(2);

describe(`<${ActionList.name}/>`, () => {
  it('renders children', () => {
    render(
      <ActionList>
        <button>{label}</button>
      </ActionList>,
    );
    expect(screen.getByRole('button', { name: label })).toBeVisible();
  });

  it('accepts className override', () => {
    const { container } = render(
      <ActionList className="custom-class">
        <button>{label}</button>
      </ActionList>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('forwards dataTestId', () => {
    render(
      <ActionList dataTestId="action-list">
        <button>{label}</button>
      </ActionList>,
    );
    expect(screen.getByTestId('action-list')).toBeVisible();
  });
});
