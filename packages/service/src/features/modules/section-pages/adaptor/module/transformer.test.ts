import { makeRawSectionPagesModule } from '@blog/service/testing/modules/fixtures';

import { toSectionPagesModuleDocument } from './transformer';

describe(toSectionPagesModuleDocument, () => {
  it('maps an authored heading block', () => {
    const module = toSectionPagesModuleDocument(makeRawSectionPagesModule());

    expect(module.headingBlock?.heading).toBe('In this section');
  });

  it('leaves the heading block, alignment and layout undefined when unset', () => {
    const module = toSectionPagesModuleDocument(
      makeRawSectionPagesModule({
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
