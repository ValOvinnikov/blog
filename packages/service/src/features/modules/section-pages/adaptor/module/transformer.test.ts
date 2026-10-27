import {
  MOCK_SECTION_PAGES_HEADING,
  mockRawSectionPagesModule,
} from '@blog/service/testing/modules/fixtures';

import { toSectionPagesModuleDocument } from './transformer';

describe(toSectionPagesModuleDocument, () => {
  it('maps an authored heading block', () => {
    const module = toSectionPagesModuleDocument(mockRawSectionPagesModule());

    expect(module.headingBlock?.heading).toBe(MOCK_SECTION_PAGES_HEADING);
  });

  it('leaves heading block, alignment and layout undefined when unset', () => {
    const module = toSectionPagesModuleDocument(
      mockRawSectionPagesModule({
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
