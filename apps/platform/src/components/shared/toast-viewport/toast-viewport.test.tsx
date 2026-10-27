import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { ToastViewport } from './toast-viewport';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.word();
const MOCK_FIRST = faker.lorem.word();
const MOCK_SECOND = faker.lorem.word();

const setup = customRender(ToastViewport, { ariaLabel: MOCK_LABEL });

describe(`<${ToastViewport.name}/>`, () => {
  it('renders a labelled region', () => {
    setup();

    const region = screen.getByRole('region', { name: MOCK_LABEL });

    expect(region).toBeVisible();
  });

  it('renders its children in the order given', () => {
    setup({
      children: (
        <>
          <span>{MOCK_FIRST}</span>
          <span>{MOCK_SECOND}</span>
        </>
      ),
    });

    const region = screen.getByRole('region', { name: MOCK_LABEL });

    expect(region).toHaveTextContent(`${MOCK_FIRST}${MOCK_SECOND}`);
  });
});
