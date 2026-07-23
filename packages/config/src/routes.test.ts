import { routes } from './routes';

describe('routes', () => {
  it('builds the home path', () => {
    expect(routes.home()).toBe('/');
  });

  it('builds page 1 of the blog index without a page segment', () => {
    expect(routes.blogIndex()).toBe('/blog');
    expect(routes.blogIndex(1)).toBe('/blog');
  });

  it('builds page N of the blog index under /blog/page/', () => {
    expect(routes.blogIndex(2)).toBe('/blog/page/2');
    expect(routes.blogIndex(10)).toBe('/blog/page/10');
  });

  it('builds post, category, author, topics, and generic-page paths', () => {
    expect(routes.post('my-post')).toBe('/blog/my-post');
    expect(routes.category('design')).toBe('/category/design');
    expect(routes.author('jane-doe')).toBe('/author/jane-doe');
    expect(routes.topics()).toBe('/topics');
    expect(routes.genericPage('about')).toBe('/about');
  });

  it('builds page 1 of a category without a page segment', () => {
    expect(routes.category('design')).toBe('/category/design');
    expect(routes.category('design', 1)).toBe('/category/design');
  });

  it('builds page N of a category under /category/{slug}/page/', () => {
    expect(routes.category('design', 2)).toBe('/category/design/page/2');
    expect(routes.category('design', 10)).toBe('/category/design/page/10');
  });

  it('builds page 1 of a tag without a page segment', () => {
    expect(routes.tag('typescript')).toBe('/tag/typescript');
    expect(routes.tag('typescript', 1)).toBe('/tag/typescript');
  });

  it('builds page N of a tag under /tag/{slug}/page/', () => {
    expect(routes.tag('typescript', 2)).toBe('/tag/typescript/page/2');
    expect(routes.tag('typescript', 10)).toBe('/tag/typescript/page/10');
  });

  it('builds page 1 of an author archive without a page segment', () => {
    expect(routes.author('jane-doe')).toBe('/author/jane-doe');
    expect(routes.author('jane-doe', 1)).toBe('/author/jane-doe');
  });

  it('builds page N of an author archive under /author/{slug}/page/', () => {
    expect(routes.author('jane-doe', 2)).toBe('/author/jane-doe/page/2');
    expect(routes.author('jane-doe', 10)).toBe('/author/jane-doe/page/10');
  });
});
