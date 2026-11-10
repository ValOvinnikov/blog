import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockStatsModule } from '@web/testing/modules/stats/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { ModuleSection } from './module-section';

faker.seed(5135);

const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRender(ModuleSection, {
  module: mockStatsModule({
    headingBlock: mockHeadingBlock({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    }),
  }),
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
  children: <p>{MOCK_CONTENT}</p>,
});

describe(`<${ModuleSection.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('is a region named by the module heading', () => {
    const region = screen.getByRole('region', { name: MOCK_HEADING });

    expect(region).toBeVisible();
  });

  it('renders the module heading as a level-two heading', () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_HEADING,
    });

    expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
  });

  it('renders the supporting text', () => {
    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });

  it('renders its children', () => {
    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });
});
