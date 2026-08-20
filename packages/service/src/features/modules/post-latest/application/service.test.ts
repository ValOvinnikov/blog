import { createPostLatestModuleService } from './service';

describe('createPostLatestModuleService', () => {
  it('exposes v1.getPostLatest as a function', () => {
    const svc = createPostLatestModuleService();
    expect(typeof svc.v1.getPostLatest).toBe('function');
  });
});
