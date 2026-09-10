import { createPostRelatedModuleService } from './service';

describe('createPostRelatedModuleService', () => {
  it('exposes v1.getPostRelated as a function', () => {
    const svc = createPostRelatedModuleService();
    expect(typeof svc.v1.getPostRelated).toBe('function');
  });
});
