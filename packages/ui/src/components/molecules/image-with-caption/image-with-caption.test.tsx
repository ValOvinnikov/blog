import { faker } from '@faker-js/faker';
import { IMAGE_LAYOUT } from '@shinefold/config';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

import { ImageWithCaption } from './image-with-caption';

faker.seed(123);

const MOCK_CAPTION = faker.lorem.sentence();
const MOCK_ALT_TEXT = faker.lorem.words(3);
const MOCK_SRC = faker.image.url();

const setup = customRender(ImageWithCaption, {
  caption: MOCK_CAPTION,
  children: <img src={MOCK_SRC} alt={MOCK_ALT_TEXT} />,
});

describe(`<${ImageWithCaption.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders as a figure', () => {
      const figure = screen.getByRole('figure');

      expect(figure).toBeVisible();
    });

    it('renders children inside the frame', () => {
      const image = screen.getByRole('img', { name: MOCK_ALT_TEXT });

      expect(image).toBeVisible();
    });
  });

  it.each([
    { title: 'an empty string', caption: '' },
    { title: 'omitted', caption: undefined },
  ])('renders no caption when the caption is $title', ({ caption }) => {
    setup({ caption, children: undefined });

    const figure = screen.getByRole('figure');

    expect(figure).not.toHaveAccessibleName();
  });

  it.each(Object.values(IMAGE_LAYOUT))(
    'renders the image and caption for the %s layout',
    (layout) => {
      setup({ layout });

      const image = screen.getByRole('img', { name: MOCK_ALT_TEXT });
      const caption = screen.getByText(MOCK_CAPTION);

      expect(image).toBeVisible();
      expect(caption).toBeVisible();
    },
  );
});
