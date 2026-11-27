import {
  MOCK_SECTION_PAGES_HEADING,
  mockRawSectionPagesModule,
} from '@shinefold/service/testing/modules/section-pages/fixtures';
import {
  MOCK_AUTHORED_MODULE_APPEARANCE,
  MOCK_UNSET_MODULE_APPEARANCE,
} from '@shinefold/service/testing/shared/module-appearance';

import { toSectionPagesModuleDocument } from './transformer';

describe(toSectionPagesModuleDocument, () => {
  it('maps an authored heading block', () => {
    const module = toSectionPagesModuleDocument(mockRawSectionPagesModule());

    expect(module.headingBlock?.heading).toBe(MOCK_SECTION_PAGES_HEADING);
  });

  it('leaves heading block, alignment, layout and appearance undefined when unset', () => {
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
    expect(module).toMatchObject(MOCK_UNSET_MODULE_APPEARANCE);
  });

  it('maps the authored appearance overrides straight through', () => {
    const module = toSectionPagesModuleDocument(
      mockRawSectionPagesModule(MOCK_AUTHORED_MODULE_APPEARANCE),
    );

    expect(module).toMatchObject(MOCK_AUTHORED_MODULE_APPEARANCE);
  });
});
