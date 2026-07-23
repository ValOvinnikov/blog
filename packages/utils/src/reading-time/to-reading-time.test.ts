import { toReadingTimeMinutes } from './to-reading-time';

describe('toReadingTimeMinutes', () => {
  it('divides and rounds up to whole minutes at 200 wpm', () => {
    expect(toReadingTimeMinutes(400)).toBe(2);
    expect(toReadingTimeMinutes(401)).toBe(3);
  });

  it('returns 1 for a short post or empty body', () => {
    expect(toReadingTimeMinutes(50)).toBe(1);
    expect(toReadingTimeMinutes(0)).toBe(1);
  });

  it('rounds up right at the minute boundary', () => {
    expect(toReadingTimeMinutes(200)).toBe(1);
    expect(toReadingTimeMinutes(201)).toBe(2);
  });

  it('accepts a custom words-per-minute rate', () => {
    expect(toReadingTimeMinutes(300, 100)).toBe(3);
  });
});
