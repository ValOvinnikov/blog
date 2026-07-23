import { makeRawGenericPage } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it } from 'vitest';

import { genericPageQuery } from './query';

describe('genericPageQuery', () => {
  it('parses a generic page with no modules and no SEO', () => {
    const raw = makeRawGenericPage({ modules: null, seo: null });

    expect(() => genericPageQuery.parse(raw)).not.toThrow();
  });
});
