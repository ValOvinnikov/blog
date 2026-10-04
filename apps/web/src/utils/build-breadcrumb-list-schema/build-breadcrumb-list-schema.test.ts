import { LOCALE_ISO_CODES } from '@blog/config';
import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { getRequestContext } from '@web/server/request-context/request-context';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { buildBreadcrumbListSchema } from './build-breadcrumb-list-schema';

const trail: IBreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Engineering', href: '/topics/engineering' },
  { label: 'Hello World', href: '/blog/hello-world' },
];

vi.mock('@web/server/request-context/request-context');

const mockContext = (overrides: Partial<typeof DEFAULT_REQUEST_CONTEXT>) =>
  vi
    .mocked(getRequestContext)
    .mockResolvedValue({ ...DEFAULT_REQUEST_CONTEXT, ...overrides });

describe(buildBreadcrumbListSchema, () => {
  beforeEach(() => {
    mockContext({ metadataBase: new URL('https://example.com') });
  });

  it('builds a BreadcrumbList schema from the trail', async () => {
    mockContext({ metadataBase: new URL('https://example.com') });
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://example.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Engineering',
          item: 'https://example.com/topics/engineering',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Hello World',
          item: 'https://example.com/blog/hello-world',
        },
      ],
    });
  });

  it('assigns 1-based positions in trail order', async () => {
    mockContext({ metadataBase: new URL('https://example.com') });
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.position)).toEqual([
      1, 2, 3,
    ]);
  });

  it('builds absolute item URLs from the base URL and each item href', async () => {
    mockContext({ metadataBase: new URL('https://blog.example.com') });
    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      'https://blog.example.com/',
      'https://blog.example.com/topics/engineering',
      'https://blog.example.com/blog/hello-world',
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
      'https://example.com/nl',
      'https://example.com/nl/topics/engineering',
      'https://example.com/nl/blog/hello-world',
    ]);
  });

  it('leaves item URLs unprefixed when the page language is the tenant default', async () => {
    mockContext({
      locale: LOCALE_ISO_CODES.NL,
      defaultLocale: LOCALE_ISO_CODES.NL,
    });

    const schema = await buildBreadcrumbListSchema(trail);

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      'https://example.com/',
      'https://example.com/topics/engineering',
      'https://example.com/blog/hello-world',
    ]);
  });
});
