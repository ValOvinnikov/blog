import {
  makeRawChildPage,
  makeRawChildPagesModule,
} from '@blog/service/testing/modules/fixtures';

import { toChildPagesModule } from './transformer';

describe(toChildPagesModule, () => {
  it('maps each child page to a card titled by its heading, summarised by its supporting text', () => {
    const module = toChildPagesModule(makeRawChildPagesModule(), [
      makeRawChildPage(),
    ]);

    expect(module.pages).toEqual([
      expect.objectContaining({
        id: 'page-faq',
        title: 'FAQ',
        summary: 'Answers to common questions.',
        path: 'modules/faq',
      }),
    ]);
    expect(module.pages[0]?.image).toBeDefined();
  });

  it('keeps the children in the order they were returned', () => {
    const module = toChildPagesModule(makeRawChildPagesModule(), [
      makeRawChildPage({ _id: 'b' }),
      makeRawChildPage({ _id: 'a' }),
    ]);

    expect(module.pages.map((page) => page.id)).toEqual(['b', 'a']);
  });

  it('leaves the summary and image undefined when the child has neither', () => {
    const module = toChildPagesModule(makeRawChildPagesModule(), [
      makeRawChildPage({
        headingBlock: { heading: 'FAQ', supportingText: null },
        image: null,
      }),
    ]);

    expect(module.pages[0]?.summary).toBeUndefined();
    expect(module.pages[0]?.image).toBeUndefined();
  });

  it('leaves the heading block, alignment and layout undefined when unset', () => {
    const module = toChildPagesModule(
      makeRawChildPagesModule({
        headingBlock: null,
        contentAlignment: null,
        layout: null,
      }),
      [],
    );

    expect(module.headingBlock).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
    expect(module.pages).toEqual([]);
  });
});
