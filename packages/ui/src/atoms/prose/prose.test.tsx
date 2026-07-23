import { Size } from '@blog/config';
import { customRender } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Prose } from './prose';

faker.seed(123);

const setup = customRender(Prose, {
  children: faker.lorem.sentence(),
});

describe(`<${Prose.name}/>`, () => {
  it('renders children', () => {
    const body = faker.lorem.paragraph();
    const { getByText } = setup({ children: body });
    expect(getByText(body)).toBeVisible();
  });

  it('renders as a <div>', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('applies the default (MD) size class', () => {
    const { container } = setup();
    expect(container.firstChild).toHaveClass('text-prose');
  });

  it('applies the SM size class', () => {
    const { container } = setup({ size: Size.SM });
    expect(container.firstChild).toHaveClass('text-sm');
  });

  it('applies the LG size class', () => {
    const { container } = setup({ size: Size.LG });
    expect(container.firstChild).toHaveClass('text-lg');
  });

  it('forwards additional className', () => {
    const { container } = setup({ className: 'mx-auto' });
    expect(container.firstChild).toHaveClass('mx-auto');
  });
});
