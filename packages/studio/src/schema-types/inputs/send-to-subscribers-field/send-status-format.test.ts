import {
  formatSendCount,
  formatSendDay,
  formatSendTime,
  formatSubscribers,
} from './send-status-format';

const MOCK_MIDDAY = '2026-11-22T12:05:00.000Z';

beforeEach(() => {
  vi.stubEnv('TZ', 'UTC');
});

describe(formatSendCount, () => {
  it('groups thousands with a comma', () => {
    expect(formatSendCount(12_500)).toBe('12,500');
  });
});

describe(formatSubscribers, () => {
  it.each([
    [1, '1 subscriber'],
    [2_500, '2,500 subscribers'],
  ])('counts %i as %s', (count, expected) => {
    expect(formatSubscribers(count)).toBe(expected);
  });
});

describe(formatSendDay, () => {
  it('reads the day before the month and year', () => {
    expect(formatSendDay(MOCK_MIDDAY)).toBe('22 Nov 2026');
  });
});

describe(formatSendTime, () => {
  it('reads the time on the 24-hour clock', () => {
    expect(formatSendTime(MOCK_MIDDAY)).toBe('12:05');
  });
});
