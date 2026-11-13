import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandMark } from './brand-mark';

faker.seed(123);

const MOCK_SRC = faker.image.url();
const MOCK_TITLE = faker.company.name();
const MOCK_MARK_TEST_ID = 'brand-mark';
const MOCK_SITE_NAME = 'northern notes';
const MOCK_INITIAL = 'N';

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

  it.each([
    { siteName: MOCK_SITE_NAME, initial: MOCK_INITIAL },
    { siteName: '42 field notes', initial: '4' },
    { siteName: '  — émile’s log', initial: 'É' },
  ])(
    'shows "$initial" in the tile for a site named "$siteName"',
    ({ siteName, initial }) => {
      setup({ siteName, dataTestId: MOCK_MARK_TEST_ID });

      const mark = screen.getByTestId(MOCK_MARK_TEST_ID);

      expect(mark).toHaveTextContent(initial);
    },
  );

  it.each(['', '— · —'])(
    'shows an empty tile for the site name "%s"',
    (siteName) => {
      setup({ siteName, dataTestId: MOCK_MARK_TEST_ID });

      const mark = screen.getByTestId(MOCK_MARK_TEST_ID);

      expect(mark).toBeEmptyDOMElement();
    },
  );

  describe('with an uploaded image and no title', () => {
    beforeEach(() => {
      setup({ src: MOCK_SRC, siteName: MOCK_SITE_NAME });
    });

    it('shows the uploaded image decoratively, with an empty alt', () => {
      const image = screen.getByRole('presentation');

      expect(image).toHaveAttribute('src', MOCK_SRC);
      expect(image).toHaveAttribute('alt', '');
    });

    it('shows no initial', () => {
      const initial = screen.queryByText(MOCK_INITIAL);

      expect(initial).not.toBeInTheDocument();
    });
  });

  it('names the uploaded image after the title', () => {
    setup({ src: MOCK_SRC, title: MOCK_TITLE });

    const image = screen.getByRole('img', { name: MOCK_TITLE });

    expect(image).toBeVisible();
  });
});
