import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

import TagNumberedPage, { generateMetadata, revalidate } from './page';

faker.seed(6009);

const MOCK_METADATA = { title: faker.lorem.words(2) };
const FIRST_PAGE = '1';
const SECOND_PAGE = '2';
const NON_CANONICAL_PAGES = ['abc', '02'];

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

const firstPageParams = paramsFor(FIRST_PAGE);

const setup = customRenderAsync(TagNumberedPage, { params: firstPageParams });

describe(`<${TagNumberedPage.name}/>`, () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('renders TagPage for the requested slug and page', async () => {
    await setup({ params: paramsFor(SECOND_PAGE) });

    const tagPage = screen.getByTestId('tag-page');

    expect(tagPage).toHaveTextContent(`${MOCK_TAG_SLUG}:${SECOND_PAGE}`);
  });

  it('redirects page 1 to the canonical tag URL', async () => {
    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(enterRequestContext).toHaveBeenCalledWith(firstPageParams);
    expect(permanentRedirect).toHaveBeenCalledWith({
      href: routes.tag(MOCK_TAG_SLUG, 1),
      locale: LOCALE_ISO_CODES.EN,
    });
  });

  it.each(NON_CANONICAL_PAGES)(
    'hard-404s a non-canonical page param (%s)',
    async (page) => {
      await expect(setup({ params: paramsFor(page) })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(notFound).toHaveBeenCalledTimes(1);
    },
  );
});

describe(generateMetadata, () => {
  beforeEach(() => {
    vi.mocked(buildTagMetadata).mockResolvedValue(MOCK_METADATA);
  });

  it('builds the tag metadata for page 2', async () => {
    const metadata = await generateMetadata({ params: paramsFor(SECOND_PAGE) });

    expect(metadata).toBe(MOCK_METADATA);
    expect(buildTagMetadata).toHaveBeenCalledWith(
      MOCK_TAG_SLUG,
      Number(SECOND_PAGE),
    );
  });

  it.each([FIRST_PAGE, ...NON_CANONICAL_PAGES])(
    'returns empty metadata without building any for page param %s',
    async (page) => {
      const metadata = await generateMetadata({ params: paramsFor(page) });

      expect(metadata).toEqual({});
      expect(buildTagMetadata).not.toHaveBeenCalled();
    },
  );
});
