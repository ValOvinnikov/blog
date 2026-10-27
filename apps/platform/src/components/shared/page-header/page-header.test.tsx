import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { PageHeader } from './page-header';

faker.seed(5995);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_BADGE = faker.lorem.word();
const MOCK_ACTION = faker.lorem.words(2);

const setup = customRender(PageHeader, { title: MOCK_TITLE });

describe(`<${PageHeader.name}/>`, () => {
  describe('with only the title', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the title as a level-1 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TITLE,
      });

      expect(heading).toBeVisible();
    });

    it('renders no description', () => {
      const description = screen.queryByText(MOCK_DESCRIPTION);

      expect(description).not.toBeInTheDocument();
    });

    it('renders no actions', () => {
      const actionButton = screen.queryByRole('button');

      expect(actionButton).not.toBeInTheDocument();
    });
  });

  it('renders the description', () => {
    setup({ description: MOCK_DESCRIPTION });

    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(description).toBeVisible();
  });

  it('renders badges beside the title', () => {
    setup({ badges: <span>{MOCK_BADGE}</span> });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TITLE,
    });
    const badge = screen.getByText(MOCK_BADGE);

    expect(heading).toBeVisible();
    expect(badge).toBeVisible();
  });

  it('renders the actions', () => {
    setup({ actions: <button type="button">{MOCK_ACTION}</button> });

    const actionButton = screen.getByRole('button', { name: MOCK_ACTION });

    expect(actionButton).toBeVisible();
  });
});
