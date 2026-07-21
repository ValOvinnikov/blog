import { describe, expect, it } from 'vitest';

import { createAuthorService } from './service';

describe('createAuthorService', () => {
  it('exposes v1.getAuthor as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthor).toBe('function');
  });

  it('exposes v1.getAuthorParams as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorParams).toBe('function');
  });

  it('exposes v1.getAuthorPosts as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorPosts).toBe('function');
  });
});
