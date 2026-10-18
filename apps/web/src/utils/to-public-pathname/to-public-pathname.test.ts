import { toPublicPathname } from './to-public-pathname';

const TENANT_ID = '0262d3a7-27e1-41b6-8b4f-35dae9f7c6ee';

describe(toPublicPathname, () => {
  it('strips the tenant and locale segments from a rewritten path', () => {
    expect(toPublicPathname(`/${TENANT_ID}/EN/modules/latest-posts`)).toBe(
      '/modules/latest-posts',
    );
  });

  it('resolves the rewritten home path to the root', () => {
    expect(toPublicPathname(`/${TENANT_ID}/NL`)).toBe('/');
  });

  it('leaves a public path unchanged', () => {
    expect(toPublicPathname('/blog/hello-world')).toBe('/blog/hello-world');
    expect(toPublicPathname('/')).toBe('/');
  });

  it('leaves a path whose second segment is not a locale unchanged', () => {
    expect(toPublicPathname(`/${TENANT_ID}/blog`)).toBe(`/${TENANT_ID}/blog`);
  });
});
