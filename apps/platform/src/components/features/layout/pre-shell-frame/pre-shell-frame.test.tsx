import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@platform/testing/custom-render';

import { PreShellFrame } from './pre-shell-frame';

faker.seed(2403);

const MOCK_PAGE_TITLE = faker.lorem.words(3);
const MOCK_PAGE_CONTENT = faker.lorem.sentence();

const setup = customRender(PreShellFrame, {
  header: <h1>{MOCK_PAGE_TITLE}</h1>,
  children: <p>{MOCK_PAGE_CONTENT}</p>,
});

describe(`<${PreShellFrame.name}/>`, () => {
  it('renders its header and content inside a single main landmark', () => {
    setup();

    const main = screen.getByRole('main');
    const heading = within(main).getByRole('heading', {
      name: MOCK_PAGE_TITLE,
    });
    const pageContent = within(main).getByText(MOCK_PAGE_CONTENT);

    expect(heading).toBeVisible();
    expect(pageContent).toBeVisible();
  });
});
