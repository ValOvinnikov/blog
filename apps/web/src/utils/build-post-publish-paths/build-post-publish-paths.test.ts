import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { toTenantScopedPath } from '@web/utils/to-tenant-scoped-path';

import {
  buildPostPublishPaths,
  type TBuildPostPublishPathsInput,
} from './build-post-publish-paths';

faker.seed(104);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_POST_SLUG = faker.lorem.slug();
const [MOCK_FIRST_TAG_SLUG, MOCK_SECOND_TAG_SLUG] = faker.helpers.uniqueArray(
  faker.lorem.slug,
  2,
) as [string, string];
const [MOCK_FIRST_TOPIC_SLUG, MOCK_SECOND_TOPIC_SLUG] =
  faker.helpers.uniqueArray(faker.lorem.slug, 2) as [string, string];

const scoped = (locale: string, path: string) =>
  toTenantScopedPath(MOCK_TENANT_ID, locale, path);

const MOCK_INPUT: TBuildPostPublishPathsInput = {
  tenantId: MOCK_TENANT_ID,
  locales: [EN],
  postSlug: MOCK_POST_SLUG,
  tagSlugs: [],
  topicSlugs: [],
  blogIndexPageParams: [],
  tagPaginationParams: [],
  topicPaginationParams: [],
};

describe(buildPostPublishPaths, () => {
  it('builds the home, blog index and post detail paths', () => {
    const paths = buildPostPublishPaths(MOCK_INPUT);

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
    ]);
  });

  it('includes every blog index pagination page', () => {
    const paths = buildPostPublishPaths({
      ...MOCK_INPUT,
      blogIndexPageParams: [{ page: '2' }, { page: '3' }],
    });

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.blogIndex(2)),
      scoped(EN, routes.blogIndex(3)),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
    ]);
  });

  it('includes base and pagination paths for every tag of the tenant', () => {
    const paths = buildPostPublishPaths({
      ...MOCK_INPUT,
      tagSlugs: [MOCK_FIRST_TAG_SLUG, MOCK_SECOND_TAG_SLUG],
      tagPaginationParams: [{ slug: MOCK_SECOND_TAG_SLUG, page: '2' }],
    });

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
      scoped(EN, routes.tag(MOCK_FIRST_TAG_SLUG)),
      scoped(EN, routes.tag(MOCK_SECOND_TAG_SLUG)),
      scoped(EN, routes.tag(MOCK_SECOND_TAG_SLUG, 2)),
    ]);
  });

  it('includes base and pagination paths for every topic of the tenant', () => {
    const paths = buildPostPublishPaths({
      ...MOCK_INPUT,
      topicSlugs: [MOCK_FIRST_TOPIC_SLUG, MOCK_SECOND_TOPIC_SLUG],
      topicPaginationParams: [{ slug: MOCK_FIRST_TOPIC_SLUG, page: '2' }],
    });

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
      scoped(EN, routes.topic(MOCK_FIRST_TOPIC_SLUG)),
      scoped(EN, routes.topic(MOCK_SECOND_TOPIC_SLUG)),
      scoped(EN, routes.topic(MOCK_FIRST_TOPIC_SLUG, 2)),
    ]);
  });

  it('scopes every path to each configured locale', () => {
    const paths = buildPostPublishPaths({ ...MOCK_INPUT, locales: [EN, NL] });

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
      scoped(NL, routes.home()),
      scoped(NL, routes.blogIndex()),
      scoped(NL, routes.post(MOCK_POST_SLUG)),
    ]);
  });

  it('returns no duplicate paths', () => {
    const paths = buildPostPublishPaths({
      ...MOCK_INPUT,
      tagSlugs: [MOCK_FIRST_TAG_SLUG, MOCK_FIRST_TAG_SLUG],
    });

    expect(paths).toEqual([
      scoped(EN, routes.home()),
      scoped(EN, routes.blogIndex()),
      scoped(EN, routes.post(MOCK_POST_SLUG)),
      scoped(EN, routes.tag(MOCK_FIRST_TAG_SLUG)),
    ]);
  });
});
