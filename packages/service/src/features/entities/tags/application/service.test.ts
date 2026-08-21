import { createTagsService } from './service';

describe(createTagsService, () => {
  it('exposes v1.getTags as a function', () => {
    const svc = createTagsService();
    expect(typeof svc.v1.getTags).toBe('function');
  });
});
