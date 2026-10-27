import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { Spinner } from './spinner';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(Spinner, { label: MOCK_LABEL });

describe(`<${Spinner.name}/>`, () => {
  it.each([false, true])(
    'names the status by its label when hasLabel is %s',
    (hasLabel) => {
      setup({ hasLabel });

      const spinner = screen.getByRole('status', { name: MOCK_LABEL });

      expect(spinner).toBeVisible();
    },
  );

  it('keeps the label out of the visible text when hasLabel is false', () => {
    setup({ hasLabel: false });

    const visibleLabel = screen.queryByText(MOCK_LABEL);

    expect(visibleLabel).not.toBeInTheDocument();
  });

  it('shows the label as visible text when hasLabel is true', () => {
    setup({ hasLabel: true });

    const visibleLabel = screen.getByText(MOCK_LABEL);

    expect(visibleLabel).toBeVisible();
  });
});
