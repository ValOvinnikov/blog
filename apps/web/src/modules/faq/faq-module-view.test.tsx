import { faker } from '@faker-js/faker';
import { BRAND_VARIANT } from '@shinefold/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockFaqQuestion } from '@web/testing/modules/faq/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_RADIUS_SCOPE_CASES,
  MOCK_SCOPED_RADIUS_TOKEN,
} from '@web/testing/shared/section-appearance/fixtures';

import { FaqModuleView } from './faq-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(7231);

const MOCK_FAQ_HEADING = faker.lorem.words(3);
const MOCK_QUESTION = faker.lorem.sentence();

const setup = customRender(FaqModuleView, {
  section: { brandVariant: BRAND_VARIANT.PRIMARY },
  headingBlock: mockHeadingBlock({ heading: MOCK_FAQ_HEADING }),
  questions: [mockFaqQuestion({ question: MOCK_QUESTION })],
  ctaButtons: [],
  contentAlignment: undefined,
  titleId: faker.lorem.slug(),
  dataTestId: faker.lorem.slug(),
});

describe(`<${FaqModuleView.name}/>`, () => {
  it('renders each question as an accordion trigger', () => {
    setup();

    const trigger = screen.getByRole('button', { name: MOCK_QUESTION });

    expect(trigger).toBeVisible();
  });

  it.each(MOCK_RADIUS_SCOPE_CASES)(
    'scopes the radius token to its section $title an override',
    ({ section, scoped }) => {
      setup({ section });

      const region = screen.getByRole('region', { name: MOCK_FAQ_HEADING });

      expect(region.style.getPropertyValue(MOCK_SCOPED_RADIUS_TOKEN)).toBe(
        scoped,
      );
    },
  );
});
