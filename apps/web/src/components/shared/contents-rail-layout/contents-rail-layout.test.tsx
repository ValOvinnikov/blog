import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { ContentsRailLayout } from './contents-rail-layout';

faker.seed(6521);

vi.mock('@web/i18n/navigation');

const NAV_NAME = SITE_MESSAGES.contentsRail.label;
const MOCK_CONTENT_TEXT = faker.lorem.sentence();
const MOCK_FOOTER_TEXT = faker.lorem.sentence();
const MOCK_SHORT_BODY = [
  mockPortableTextBlock(faker.lorem.words(2), { style: 'h2' }),
  mockPortableTextBlock(faker.lorem.words(2), { style: 'h2' }),
];

const setup = customRender(ContentsRailLayout, {
  body: MOCK_CONTENTS_RAIL_BODY,
  children: <p>{MOCK_CONTENT_TEXT}</p>,
  footer: <p>{MOCK_FOOTER_TEXT}</p>,
});

describe(`<${ContentsRailLayout.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the contents rail beside the content and footer when the body has enough H2 headings', () => {
    setup();
    const rail = screen.getByRole('navigation', { name: NAV_NAME });
    const content = screen.getByText(MOCK_CONTENT_TEXT);
    const footer = screen.getByText(MOCK_FOOTER_TEXT);

    expect(rail).toBeVisible();
    expect(content).toBeVisible();
    expect(footer).toBeVisible();
  });

  it('renders the content and footer without a rail when the body has too few H2 headings', () => {
    setup({ body: MOCK_SHORT_BODY });
    const rail = screen.queryByRole('navigation', { name: NAV_NAME });
    const content = screen.getByText(MOCK_CONTENT_TEXT);
    const footer = screen.getByText(MOCK_FOOTER_TEXT);

    expect(rail).not.toBeInTheDocument();
    expect(content).toBeVisible();
    expect(footer).toBeVisible();
  });
});
