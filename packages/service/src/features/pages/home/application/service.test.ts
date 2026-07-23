import { createHomeService } from './service';

describe('createHomeService', () => {
  it('exposes v1.getHomePage as a function', () => {
    const svc = createHomeService();
    expect(typeof svc.v1.getHomePage).toBe('function');
  });
});
