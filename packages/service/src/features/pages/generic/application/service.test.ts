import { describe, expect, it } from 'vitest';

import { createGenericPageService } from './service';

describe('createGenericPageService', () => {
  it('exposes v1.getPage as a function', () => {
    const svc = createGenericPageService();
    expect(typeof svc.v1.getPage).toBe('function');
  });
});
