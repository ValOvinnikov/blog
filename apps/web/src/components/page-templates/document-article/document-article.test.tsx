import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { DocumentArticle } from './document-article';

faker.seed(6523);

vi.mock('@web/i18n/navigation');

const RAIL_NAME = SITE_MESSAGES.contentsRail.label;
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_PARAGRAPH = faker.lorem.sentence();

const setup = customRender(DocumentArticle, {
  title: MOCK_TITLE,
  body: MOCK_CONTENTS_RAIL_BODY,
});

describe(`<${DocumentArticle.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the title as the page heading', () => {
    setup();
    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent(MOCK_TITLE);
  });

  it('renders the body with the contents rail at three or more H2s', () => {
    setup();
    const rail = screen.getByRole('navigation', { name: RAIL_NAME });

    expect(rail).toBeVisible();
  });

  it('renders the body without a rail below three H2s', () => {
    setup({ body: [mockPortableTextBlock(MOCK_PARAGRAPH)] });
    const paragraph = screen.getByText(MOCK_PARAGRAPH);
    const rail = screen.queryByRole('navigation', { name: RAIL_NAME });

    expect(paragraph).toBeVisible();
    expect(rail).not.toBeInTheDocument();
  });
});
