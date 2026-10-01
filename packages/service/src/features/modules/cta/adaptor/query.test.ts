import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';

import { ctaModuleQuery } from './query';

describe('ctaModuleQuery', () => {
  it('parses a CTA document without a bandTone', () => {
    const raw = makeRawCtaModule({ bandTone: null });

    expect(() => ctaModuleQuery.parse(raw)).not.toThrow();
  });
});
