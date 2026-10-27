import { BRAND_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';

import { Section } from './section';

faker.seed(6007);

const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRender(Section, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  titleId: MOCK_TITLE_ID,
  children: (
    <>
      <h2 id={MOCK_TITLE_ID}>{MOCK_HEADING}</h2>
      <p>{MOCK_CONTENT}</p>
    </>
  ),
});

describe(`<${Section.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders its children', () => {
    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });

  it('is a region named by the heading its titleId points at', () => {
    const region = screen.getByRole('region', { name: MOCK_HEADING });

    expect(region).toBeVisible();
  });
});
