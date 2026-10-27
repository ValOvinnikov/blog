import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { MediaFrame } from './media-frame';

faker.seed(123);

const MOCK_CHILD_TEXT = faker.lorem.words(2);

const setup = customRender(MediaFrame, {});

describe(`<${MediaFrame.name}/>`, () => {
  it('renders children', () => {
    setup({ children: <span>{MOCK_CHILD_TEXT}</span> });

    const child = screen.getByText(MOCK_CHILD_TEXT);

    expect(child).toBeVisible();
  });
});
