import { describe, expect, it } from 'vitest';

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

  it('builds post, category, author, and generic-page paths', () => {
    expect(routes.post('my-post')).toBe('/blog/my-post');
    expect(routes.category('design')).toBe('/category/design');
    expect(routes.author('jane-doe')).toBe('/author/jane-doe');
    expect(routes.genericPage('about')).toBe('/about');
  });
});
