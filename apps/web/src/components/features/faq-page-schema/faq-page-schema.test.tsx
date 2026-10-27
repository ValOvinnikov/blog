import type { TFaqPageQuestion } from '@blog/service';
import { faker } from '@faker-js/faker';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';

import { FaqPageSchema } from './faq-page-schema';

faker.seed(5776);

const MOCK_QUESTION = faker.lorem.sentence();

const MOCK_FAQS: TFaqPageQuestion[] = [
  {
    id: faker.string.uuid(),
    question: MOCK_QUESTION,
    answer: faker.lorem.sentence(),
  },
];

const setup = customRender(FaqPageSchema, { faqs: MOCK_FAQS });

describe(`<${FaqPageSchema.name}/>`, () => {
  it('renders the JSON-LD FAQPage schema script', () => {
    setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
    const schemaJson = script.textContent;

    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(schemaJson).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
    expect(schemaJson).toContain(MOCK_QUESTION);
  });

  it('renders nothing when there are no FAQ questions', () => {
    const { container } = setup({ faqs: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
