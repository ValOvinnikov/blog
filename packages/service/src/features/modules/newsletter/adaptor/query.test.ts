import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { newsletterModuleQuery } from './query';

describe('newsletterModuleQuery', () => {
  it('filters to module_newsletter documents by id', () => {
    expect(newsletterModuleQuery.query).toContain(
      '_type == "module_newsletter"',
    );
    expect(newsletterModuleQuery.query).toContain('_id == $id');
  });

  it('coalesces variant to FULL for documents authored before the field existed', () => {
    expect(newsletterModuleQuery.query).toContain('coalesce(variant, "FULL")');
  });

  it('parses an authored COMPACT variant', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: makeRawHeadingBlock('Stay in the loop'),
      variant: 'COMPACT',
      layout: null,
      contentAlignment: null,
    };

    expect(newsletterModuleQuery.parse(raw).variant).toBe('COMPACT');
  });
});
