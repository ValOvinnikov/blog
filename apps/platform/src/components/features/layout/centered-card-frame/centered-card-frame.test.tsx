import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';

import { CenteredCardFrame } from './centered-card-frame';

faker.seed(6186);

const MOCK_CARD_CONTENT = faker.lorem.sentence();
const MOCK_FOOTER = faker.lorem.words(4);

const setup = customRender(CenteredCardFrame, {
  children: <p>{MOCK_CARD_CONTENT}</p>,
  footer: <p>{MOCK_FOOTER}</p>,
});

describe(`<${CenteredCardFrame.name}/>`, () => {
  it('names the product above its content and footer in one main landmark', () => {
    setup();

    const main = screen.getByRole('main');
    const wordmark = within(main).getByText(
      messages.centeredCardFrame.brandName,
    );
    const content = within(main).getByText(MOCK_CARD_CONTENT);
    const footer = within(main).getByText(MOCK_FOOTER);

    expect(wordmark).toBeVisible();
    expect(content).toBeVisible();
    expect(footer).toBeVisible();
  });
});
