import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { mockRequestContextOnce } from '@web/testing/server/request-context/mock-request-context-once';
import { MOCK_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';

import { buildBreadcrumbListSchema } from './build-breadcrumb-list-schema';

const HOME_PATH = routes.home();
const NL_PREFIX = `/${LOCALE_BCP47_TAGS.NL}`;
const TOPIC_PATH = '/topics/engineering';
const POST_PATH = '/blog/hello-world';
const POST_LABEL = 'Hello World';

const trail: IBreadcrumbItem[] = [
  { label: 'Home', href: HOME_PATH },
  { label: 'Engineering', href: TOPIC_PATH },
  { label: POST_LABEL, href: POST_PATH },
];

vi.mock('@web/server/request-context/request-context');

describe(buildBreadcrumbListSchema, () => {
  it('builds a BreadcrumbList schema from the trail', async () => {
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${MOCK_TENANT_BASE_URL}${HOME_PATH}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Engineering',
          item: `${MOCK_TENANT_BASE_URL}${TOPIC_PATH}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: POST_LABEL,
          item: `${MOCK_TENANT_BASE_URL}${POST_PATH}`,
        },
      ],
    });
  });

  it('returns undefined when there is no base URL to make item URLs absolute', async () => {
    mockRequestContextOnce({ metadataBase: undefined });

    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema).toBeUndefined();
  });

  it.each([
    {
      case: 'prefixes item URLs with a non-default page language',
      context: { locale: LOCALE_ISO_CODES.NL },
      expected: [
        NL_PREFIX,
        `${NL_PREFIX}${TOPIC_PATH}`,
        `${NL_PREFIX}${POST_PATH}`,
      ],
    },
    {
      case: 'leaves item URLs unprefixed for the tenant default language',
      context: {
        locale: LOCALE_ISO_CODES.NL,
        defaultLocale: LOCALE_ISO_CODES.NL,
      },
      expected: [HOME_PATH, TOPIC_PATH, POST_PATH],
    },
  ])('$case', async ({ context, expected }) => {
    mockRequestContextOnce(context);

    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual(
      expected.map((path) => `${MOCK_TENANT_BASE_URL}${path}`),
    );
  });
});
