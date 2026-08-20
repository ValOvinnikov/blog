import { createTopicsService } from './service';

describe('createTopicsService', () => {
  it('exposes v1.getTopics as a function', () => {
    const svc = createTopicsService();
    expect(typeof svc.v1.getTopics).toBe('function');
  });
});
