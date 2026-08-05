import { TOAST_TYPE } from './toast';

describe('TOAST_TYPE', () => {
  it('has every key equal to its value', () => {
    Object.entries(TOAST_TYPE).forEach(([key, value]) => {
      expect(value).toBe(key);
    });
  });

  it('contains every message type from the toast design spec', () => {
    expect(TOAST_TYPE).toStrictEqual({
      SUCCESS: 'SUCCESS',
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      LOADING: 'LOADING',
    });
  });
});
