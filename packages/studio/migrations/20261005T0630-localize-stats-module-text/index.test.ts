import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeStatsModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

const strings = (value: string) =>
  inEnglish('internationalizedArrayStringValue', value);

describe(localizeStatsModule, () => {
  it('moves the heading, supporting text, footnote and every stat into the default language', () => {
    expect(
      localizeStatsModule({
        headingBlock: {
          _type: 'headingBlock',
          heading: 'By the numbers',
          supportingText: 'A year in figures.',
        },
        stats: [
          {
            _key: 'stat-1',
            value: '98%',
            label: 'Uptime',
            description: 'Last twelve months',
          },
          { _key: 'stat-2', value: '1.2M', label: 'Readers' },
          { _key: 'stat-3', value: '40', label: 'Countries' },
        ],
        footnote: 'Figures as of June.',
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: strings('By the numbers'),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            'A year in figures.',
          ),
        }),
      ),
      at(['stats', { _key: 'stat-1' }, 'value'], set(strings('98%'))),
      at(['stats', { _key: 'stat-1' }, 'label'], set(strings('Uptime'))),
      at(
        ['stats', { _key: 'stat-1' }, 'description'],
        set(strings('Last twelve months')),
      ),
      at(['stats', { _key: 'stat-2' }, 'value'], set(strings('1.2M'))),
      at(['stats', { _key: 'stat-2' }, 'label'], set(strings('Readers'))),
      at(['stats', { _key: 'stat-3' }, 'value'], set(strings('40'))),
      at(['stats', { _key: 'stat-3' }, 'label'], set(strings('Countries'))),
      at('footnote', set(strings('Figures as of June.'))),
    ]);
  });

  it('localizes only the stats still holding plain text', () => {
    expect(
      localizeStatsModule({
        stats: [
          { _key: 'stat-1', value: strings('98%'), label: strings('Uptime') },
          { _key: 'stat-2', value: '1.2M', label: strings('Readers') },
        ],
      }),
    ).toEqual([
      at(['stats', { _key: 'stat-2' }, 'value'], set(strings('1.2M'))),
    ]);
  });

  it('is idempotent — an already localized module is left alone', () => {
    expect(
      localizeStatsModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('By the numbers'),
        },
        stats: [
          { _key: 'stat-1', value: strings('98%'), label: strings('Uptime') },
        ],
        footnote: strings('Figures as of June.'),
      }),
    ).toBeUndefined();
  });

  it('leaves a module without text alone', () => {
    expect(localizeStatsModule({})).toBeUndefined();
  });
});
