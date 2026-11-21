import { LOCALE_ISO_CODES } from '@shinefold/config';

import { formatLocalMoment } from './format-local-moment';

const MOCK_NOW = new Date(2026, 10, 20, 9, 0);
const MOCK_LATER_TODAY = new Date(2026, 10, 20, 15, 30);
const MOCK_TOMORROW = new Date(2026, 10, 21, 15, 30);

describe(formatLocalMoment, () => {
  it('gives only the time for a moment later today', () => {
    const moment = formatLocalMoment(
      MOCK_LATER_TODAY,
      MOCK_NOW,
      LOCALE_ISO_CODES.EN,
    );

    expect(moment).toEqual({
      isToday: true,
      text: expect.stringMatching(/^3:30\sPM$/),
    });
  });

  it('adds the date for a moment on another day', () => {
    const moment = formatLocalMoment(
      MOCK_TOMORROW,
      MOCK_NOW,
      LOCALE_ISO_CODES.EN,
    );

    expect(moment).toEqual({
      isToday: false,
      text: expect.stringMatching(/^Nov 21, 2026, 3:30\sPM$/),
    });
  });
});
