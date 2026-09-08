import { service } from './index';

describe('service.modules', () => {
  it('exposes v1.getHero/getPostList/getContent/getCta as functions', () => {
    expect(typeof service.modules.hero.v1.getHero).toBe('function');
    expect(typeof service.modules.postList.v1.getPostList).toBe('function');
    expect(typeof service.modules.content.v1.getContent).toBe('function');
    expect(typeof service.modules.cta.v1.getCta).toBe('function');
  });
});

describe('service.pages', () => {
  it('keeps home and exposes the landing page fetcher', () => {
    expect(typeof service.pages.home.v1.getHomePage).toBe('function');
    expect(typeof service.pages.landing.v1.getPage).toBe('function');
  });
});
