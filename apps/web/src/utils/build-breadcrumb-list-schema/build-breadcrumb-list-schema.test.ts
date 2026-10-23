import { LOCALE_ISO_CODES } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildBreadcrumbListSchema } from './build-breadcrumb-list-schema';

const HOME_LABEL = 'Home';
const TOPIC_LABEL = 'Engineering';
const POST_LABEL = 'Hello World';
const TOPIC_HREF = '/topics/engineering';
const POST_HREF = '/blog/hello-world';
const BASE_URL = 'https://example.com';
const BLOG_BASE_URL = 'https://blog.example.com';

const trail: IBreadcrumbItem[] = [
  { label: HOME_LABEL, href: '/' },
  { label: TOPIC_LABEL, href: TOPIC_HREF },
  { label: POST_LABEL, href: POST_HREF },
];

vi.mock('@web/server/request-context/request-context');

const mockContext = (overrides: Partial<typeof MOCK_REQUEST_CONTEXT>) =>
  vi
    .mocked(getRequestContext)
    .mockResolvedValue({ ...MOCK_REQUEST_CONTEXT, ...overrides });

describe(buildBreadcrumbListSchema, () => {
  beforeEach(() => {
    mockContext({ metadataBase: new URL(BASE_URL) });
  });

  it('builds a BreadcrumbList schema from the trail', async () => {
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: HOME_LABEL,
          item: `${BASE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: TOPIC_LABEL,
          item: `${BASE_URL}${TOPIC_HREF}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: POST_LABEL,
          item: `${BASE_URL}${POST_HREF}`,
        },
      ],
    });
  });

  it('assigns 1-based positions in trail order', async () => {
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.position)).toEqual([
      1, 2, 3,
    ]);
  });

  it('builds absolute item URLs from the base URL and each item href', async () => {
    mockContext({ metadataBase: new URL(BLOG_BASE_URL) });
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      `${BLOG_BASE_URL}/`,
      `${BLOG_BASE_URL}${TOPIC_HREF}`,
      `${BLOG_BASE_URL}${POST_HREF}`,
    ]);
  });

  it('returns undefined when there is no base URL, rather than emitting a relative (invalid) url', async () => {
    mockContext({ metadataBase: undefined });
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema).toBeUndefined();
  });

  it('prefixes every item URL with the language on a non-default-language page', async () => {
    mockContext({ locale: LOCALE_ISO_CODES.NL });

    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      `${BASE_URL}/nl`,
      `${BASE_URL}/nl${TOPIC_HREF}`,
      `${BASE_URL}/nl${POST_HREF}`,
    ]);
  });

  it('leaves item URLs unprefixed when the page language is the tenant default', async () => {
    mockContext({
      locale: LOCALE_ISO_CODES.NL,
      defaultLocale: LOCALE_ISO_CODES.NL,
    });

    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      `${BASE_URL}/`,
      `${BASE_URL}${TOPIC_HREF}`,
      `${BASE_URL}${POST_HREF}`,
    ]);
  });
});
