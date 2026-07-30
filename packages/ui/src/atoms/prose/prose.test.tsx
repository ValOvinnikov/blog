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

  it('forwards additional className', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
