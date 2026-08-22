import { createTopicService } from './service';

describe('createTopicService', () => {
  it('exposes v1.getTopicPage as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicPage).toBe('function');
  });

  it('exposes v1.getTopicParams as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicParams).toBe('function');
  });

  it('exposes v1.getTopicPaginationParams as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicPaginationParams).toBe('function');
  });
});
