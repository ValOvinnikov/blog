import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandMark } from './brand-mark';

faker.seed(123);

const MOCK_SRC = faker.image.url();
const MOCK_TITLE = faker.company.name();

const setup = customRender(BrandMark, {});

describe(`<${BrandMark.name}/>`, () => {
  it('is decorative by default, with no accessible role or name', () => {
    setup();

    const mark = screen.queryByRole('img');

    expect(mark).not.toBeInTheDocument();
  });

  it('exposes an accessible name when a title is provided', () => {
    setup({ title: MOCK_TITLE });

    const mark = screen.getByRole('img', { name: MOCK_TITLE });

    expect(mark).toBeVisible();
  });

  describe('with an uploaded image and no title', () => {
    beforeEach(() => {
      setup({ src: MOCK_SRC });
    });

    it('shows the uploaded image instead of the polygon mark', () => {
      const image = screen.getByRole('presentation');

      expect(image).toHaveAttribute('src', MOCK_SRC);
    });

    it('gives the image an empty alt', () => {
      const image = screen.getByRole('presentation');

      expect(image).toHaveAttribute('alt', '');
    });
  });

  it('names the uploaded image after the title', () => {
    setup({ src: MOCK_SRC, title: MOCK_TITLE });

    const image = screen.getByRole('img', { name: MOCK_TITLE });

    expect(image).toBeVisible();
  });
});
