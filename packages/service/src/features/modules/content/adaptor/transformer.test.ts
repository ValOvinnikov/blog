import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { toContentModule } from './transformer';

describe('toContentModule', () => {
  it('maps title and body straight through (both schema-required)', () => {
    const raw = makeRawContentModule({ title: 'About us' });

    const module = toContentModule(raw);

    expect(module.title).toBe('About us');
    expect(module.body).toHaveLength(1);
  });
});
