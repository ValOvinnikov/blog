import { makeRawChildPagesModule } from '@blog/service/testing/modules/fixtures';

import { toChildPagesModuleDocument } from './transformer';

describe(toChildPagesModuleDocument, () => {
  it('maps an authored heading block', () => {
    const module = toChildPagesModuleDocument(makeRawChildPagesModule());

    expect(module.headingBlock?.heading).toBe('In this section');
  });

  it('leaves the heading block, alignment and layout undefined when unset', () => {
    const module = toChildPagesModuleDocument(
      makeRawChildPagesModule({
        headingBlock: null,
        contentAlignment: null,
        layout: null,
      }),
    );

    expect(module.headingBlock).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });
});
