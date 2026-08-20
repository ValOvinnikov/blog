import type { IBreadcrumbItem } from '@blog/ui/molecules';

import { buildBreadcrumbListSchema } from './build-breadcrumb-list-schema';

const trail: IBreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Engineering', href: '/topics/engineering' },
  { label: 'Hello World', href: '/blog/hello-world' },
];

describe(buildBreadcrumbListSchema, () => {
  it('builds a BreadcrumbList schema from the trail', () => {
    const schema = buildBreadcrumbListSchema(trail, 'https://example.com');

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

  it('assigns 1-based positions in trail order', () => {
    const schema = buildBreadcrumbListSchema(trail, 'https://example.com');

    expect(schema?.itemListElement.map((item) => item.position)).toEqual([
      1, 2, 3,
    ]);
  });

  it('builds absolute item URLs from siteUrl and each item href', () => {
    const schema = buildBreadcrumbListSchema(trail, 'https://blog.example.com');

    expect(schema?.itemListElement.map((item) => item.item)).toEqual([
      'https://blog.example.com/',
      'https://blog.example.com/topics/engineering',
      'https://blog.example.com/blog/hello-world',
    ]);
  });

  it('returns undefined when siteUrl is empty, rather than emitting a relative (invalid) url', () => {
    const schema = buildBreadcrumbListSchema(trail, '');

    expect(schema).toBeUndefined();
  });
});
