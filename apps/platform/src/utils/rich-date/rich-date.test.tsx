import { customRender, screen } from '@platform/testing/custom-render';
import { LOCALE_ISO_CODES } from '@shinefold/config';

import { richDate } from './rich-date';

const MOCK_DATE = new Date('2026-12-02T00:00:00.000Z');
const MOCK_CHUNK = 'the second of December';

const RichDateProbe = () =>
  richDate(MOCK_DATE, LOCALE_ISO_CODES.EN).time(MOCK_CHUNK);

describe(richDate, () => {
  it('formats the date for the locale', () => {
    const { date } = richDate(MOCK_DATE, LOCALE_ISO_CODES.EN);

    expect(date).toBe('Dec 2, 2026');
  });

  it('wraps the chunks in a time element carrying the ISO date', () => {
    customRender(RichDateProbe, {})();

    const time = screen.getByText(MOCK_CHUNK);

    expect(time).toHaveAttribute('dateTime', MOCK_DATE.toISOString());
  });
});
