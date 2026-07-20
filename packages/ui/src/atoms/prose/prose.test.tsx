import { Size } from '@blog/config';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { Prose } from './prose';

faker.seed(123);

describe(`<${Prose.name}/>`, () => {
  it('renders children', () => {
    const body = faker.lorem.paragraph();
    render(<Prose>{body}</Prose>);
    expect(screen.getByText(body)).toBeVisible();
  });

  it('renders as a <div>', () => {
    const { container } = render(<Prose>{faker.lorem.sentence()}</Prose>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('applies the default (MD) size class', () => {
    const { container } = render(<Prose>{faker.lorem.sentence()}</Prose>);
    expect(container.firstChild).toHaveClass('text-prose');
  });

  it('applies the SM size class', () => {
    const { container } = render(
      <Prose size={Size.SM}>{faker.lorem.sentence()}</Prose>,
    );
    expect(container.firstChild).toHaveClass('text-sm');
  });

  it('applies the LG size class', () => {
    const { container } = render(
      <Prose size={Size.LG}>{faker.lorem.sentence()}</Prose>,
    );
    expect(container.firstChild).toHaveClass('text-lg');
  });

  it('forwards additional className', () => {
    const { container } = render(
      <Prose className="mx-auto">{faker.lorem.sentence()}</Prose>,
    );
    expect(container.firstChild).toHaveClass('mx-auto');
  });
});
