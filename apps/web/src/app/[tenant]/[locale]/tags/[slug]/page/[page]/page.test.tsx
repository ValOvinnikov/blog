import { faker } from '@faker-js/faker';
import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@shinefold/config';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';

import TagNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };
const MOCK_PAGE = faker.number.int({ min: 2, max: 999 });

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/i18n/navigation');

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug, page }: { slug: string; page: number }) => (
    <div data-testid="tag-page">{`${slug}:${page}`}</div>
  ),
}));

const paramsFor = (page: string) =>
  mockRouteParams({ slug: MOCK_TAG_SLUG, page });

const pageParams = paramsFor(String(MOCK_PAGE));

const setup = customRenderAsync(TagNumberedPage, { params: pageParams });

describe(`<${TagNumberedPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders TagPage for the requested slug and page', async () => {
    await setup();

    const tagPage = screen.getByTestId('tag-page');

    expect(tagPage).toHaveTextContent(`${MOCK_TAG_SLUG}:${MOCK_PAGE}`);
  });

  it('redirects page 1 to the tag first page', async () => {
    await expect(setup({ params: paramsFor(String(1)) })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: routes.tag(MOCK_TAG_SLUG, 1),
      locale: LOCALE_ISO_CODES.EN,
    });
  });
});

describe(generateMetadata, () => {
  it('builds the tag metadata for the requested page', async () => {
    vi.mocked(buildTagMetadata).mockResolvedValue(MOCK_METADATA);

    const metadata = await generateMetadata({ params: pageParams });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTagMetadata).toHaveBeenCalledWith(MOCK_TAG_SLUG, MOCK_PAGE);
  });
});
