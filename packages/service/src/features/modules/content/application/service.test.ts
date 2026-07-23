import { createContentModuleService } from './service';

describe('createContentModuleService', () => {
  it('exposes v1.getContent as a function', () => {
    const svc = createContentModuleService();
    expect(typeof svc.v1.getContent).toBe('function');
  });
});
