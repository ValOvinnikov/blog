import type { TFaqPageQuestion } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';

import { FaqPageSchema } from './faq-page-schema';

const faqs: TFaqPageQuestion[] = [
  { id: 'faq-1', question: 'Do you offer a free trial?', answer: 'Yes.' },
];

const setup = customRender(FaqPageSchema, { faqs });

describe(`<${FaqPageSchema.name}/>`, () => {
  it('renders the JSON-LD FAQPage schema script', () => {
    setup();

    const script = screen.getByTestId('json-ld-script');
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script.textContent).toContain('"@type":"FAQPage"');
  });

  it('renders nothing when there are no FAQ questions', () => {
    const { container } = setup({ faqs: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
