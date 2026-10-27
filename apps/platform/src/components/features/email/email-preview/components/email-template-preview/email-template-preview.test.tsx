import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { EmailTemplatePreview } from './email-template-preview';

faker.seed(5993);

const MOCK_TITLE = faker.lorem.words(2);

const setup = customRender(EmailTemplatePreview, {
  html: `<p>${faker.lorem.sentence()}</p>`,
  title: MOCK_TITLE,
});

describe(`<${EmailTemplatePreview.name}/>`, () => {
  it('sandboxes the preview frame with every capability withheld', () => {
    setup();

    const frame = screen.getByTitle(MOCK_TITLE);

    expect(frame).toHaveAttribute('sandbox', '');
  });
});
