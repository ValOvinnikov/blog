import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { SettingRow } from './setting-row';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_CONTROL_LABEL = faker.lorem.words(2);

const setup = customRender(SettingRow, { label: MOCK_LABEL });

describe(`<${SettingRow.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the label as a level-3 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_LABEL,
      });

      expect(heading).toBeVisible();
    });

    it('renders no description or control', () => {
      const description = screen.queryByText(MOCK_DESCRIPTION);
      const control = screen.queryByRole('button');

      expect(description).not.toBeInTheDocument();
      expect(control).not.toBeInTheDocument();
    });
  });

  it('renders the label at a custom heading level', () => {
    setup({ labelLevel: 2 });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_LABEL,
    });

    expect(heading).toBeVisible();
  });

  it('renders the description when given', () => {
    setup({ description: MOCK_DESCRIPTION });

    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(description).toBeVisible();
  });

  it('renders control-slot children', () => {
    setup({ children: <button>{MOCK_CONTROL_LABEL}</button> });

    const control = screen.getByRole('button', { name: MOCK_CONTROL_LABEL });

    expect(control).toBeVisible();
  });
});
