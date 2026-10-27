import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { faker } from '@faker-js/faker';
import { mockRequestContextOnce } from '@web/testing/server/request-context/mock-request-context-once';
import { MOCK_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';

import { buildBreadcrumbListSchema } from './build-breadcrumb-list-schema';

faker.seed(103);

const HOME_PATH = routes.home();
const NL_PREFIX = `/${LOCALE_BCP47_TAGS.NL}`;
const MOCK_TOPIC_PATH = `/${faker.lorem.slug()}`;
const MOCK_POST_PATH = `/${faker.lorem.slug()}`;
const MOCK_HOME_LABEL = faker.lorem.word();
const MOCK_TOPIC_LABEL = faker.lorem.word();
const MOCK_POST_LABEL = faker.lorem.words(2);

const MOCK_TRAIL: IBreadcrumbItem[] = [
  { label: MOCK_HOME_LABEL, href: HOME_PATH },
  { label: MOCK_TOPIC_LABEL, href: MOCK_TOPIC_PATH },
  { label: MOCK_POST_LABEL, href: MOCK_POST_PATH },
];

vi.mock('@web/server/request-context/request-context');

describe(buildBreadcrumbListSchema, () => {
  it('builds a BreadcrumbList schema from the trail', async () => {
    const schema = await buildBreadcrumbListSchema(MOCK_TRAIL);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: MOCK_HOME_LABEL,
          item: `${MOCK_TENANT_BASE_URL}${HOME_PATH}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: MOCK_TOPIC_LABEL,
          item: `${MOCK_TENANT_BASE_URL}${MOCK_TOPIC_PATH}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: MOCK_POST_LABEL,
          item: `${MOCK_TENANT_BASE_URL}${MOCK_POST_PATH}`,
        },
      ],
    });
  });

  it('returns undefined when there is no base URL', async () => {
    mockRequestContextOnce({ metadataBase: undefined });

    const schema = await buildBreadcrumbListSchema(MOCK_TRAIL);

    expect(schema).toBeUndefined();
  });

  it.each([
    {
      case: 'prefixes item URLs with a non-default page language',
      context: { locale: LOCALE_ISO_CODES.NL },
      expected: [
        NL_PREFIX,
        `${NL_PREFIX}${MOCK_TOPIC_PATH}`,
        `${NL_PREFIX}${MOCK_POST_PATH}`,
      ],
    },
    {
      case: 'leaves item URLs unprefixed for the tenant default language',
      context: {
        locale: LOCALE_ISO_CODES.NL,
        defaultLocale: LOCALE_ISO_CODES.NL,
      },
      expected: [HOME_PATH, MOCK_TOPIC_PATH, MOCK_POST_PATH],
    },
  ])('$case', async ({ context, expected }) => {
    mockRequestContextOnce(context);

    const schema = await buildBreadcrumbListSchema(MOCK_TRAIL);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual(
      expected.map((path) => `${MOCK_TENANT_BASE_URL}${path}`),
    );
  });
});
