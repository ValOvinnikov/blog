import { formatRelativeTime } from './format-relative-time';

const NOW = new Date('2026-08-26T12:00:00.000Z');

describe(formatRelativeTime, () => {
  it('renders "Just now" for an event less than a minute old', () => {
    const date = new Date('2026-08-26T11:59:31.000Z');
    expect(formatRelativeTime(date, NOW)).toBe('Just now');
  });

  it('renders minutes for an event under an hour old', () => {
    const date = new Date('2026-08-26T11:45:00.000Z');
    expect(formatRelativeTime(date, NOW)).toBe('15m ago');
  });

  it('renders hours for an event under a day old', () => {
    const date = new Date('2026-08-26T10:00:00.000Z');
    expect(formatRelativeTime(date, NOW)).toBe('2h ago');
  });

  it('renders days for an event under a week old', () => {
    const date = new Date('2026-08-24T12:00:00.000Z');
    expect(formatRelativeTime(date, NOW)).toBe('2d ago');
  });

  it('falls back to an absolute short date past a week old', () => {
    const date = new Date('2026-08-12T14:22:00.000Z');
    expect(formatRelativeTime(date, NOW)).toBe('Aug 12');
  });
});
