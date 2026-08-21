import { createTopicIndexService } from './service';

describe('createTopicIndexService', () => {
  it('exposes v1.getIndexPage as a function', () => {
    const svc = createTopicIndexService();
    expect(typeof svc.v1.getIndexPage).toBe('function');
  });
});
