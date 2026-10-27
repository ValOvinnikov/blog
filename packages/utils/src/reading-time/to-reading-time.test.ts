import { toReadingTimeMinutes } from './to-reading-time';

describe(toReadingTimeMinutes, () => {
  it.each([
    [200, 1],
    [201, 2],
  ])('reads %i words in %i minutes at the default rate', (words, minutes) => {
    expect(toReadingTimeMinutes(words)).toBe(minutes);
  });

  it('accepts a custom words-per-minute rate', () => {
    expect(toReadingTimeMinutes(300, 100)).toBe(3);
  });
});
