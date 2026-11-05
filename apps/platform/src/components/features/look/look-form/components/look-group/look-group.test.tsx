import { faker } from '@faker-js/faker';
import { Accordion } from '@platform/components/shared/accordion';
import { LOOK_GROUP } from '@platform/constants/look-group';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';

import { LookGroup } from './look-group';

faker.seed(6600);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_COLOUR_ROW = faker.lorem.word();
const MOCK_BRAND_ROW = faker.lorem.words(2);

describe(`<${LookGroup.name}/>`, () => {
  beforeEach(() => {
    renderWithIntl(
      <LookGroup
        anchor={LOOK_GROUP.STYLE}
        title={MOCK_TITLE}
        group={{
          openValues: [],
          onOpenValuesChange: vi.fn(),
          actionsRef: vi.fn(),
        }}
      >
        <Accordion.Item value={LOOK_ROW.COLOUR}>
          <Accordion.Trigger>{MOCK_COLOUR_ROW}</Accordion.Trigger>
          <Accordion.Panel>{null}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={LOOK_ROW.BRAND}>
          <Accordion.Trigger>{MOCK_BRAND_ROW}</Accordion.Trigger>
          <Accordion.Panel>{null}</Accordion.Panel>
        </Accordion.Item>
      </LookGroup>,
    );
  });

  it('holds its rows as a list inside a region named by its heading', () => {
    const region = screen.getByRole('region', { name: MOCK_TITLE });
    const items = within(region).getAllByRole('listitem');

    expect(items).toHaveLength(2);
  });
});
