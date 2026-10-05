import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeTimelineModule } from './index';

const { EN } = LOCALE_ISO_CODES;

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

const strings = (value: string) =>
  inEnglish('internationalizedArrayStringValue', value);

const paragraph = (text: string) => [
  {
    _type: 'block',
    _key: text,
    style: 'normal',
    children: [{ _type: 'span', _key: 'span', text, marks: [] }],
    markDefs: [],
  },
];

const paragraphs = (text: string) =>
  inEnglish('internationalizedArrayParagraphTextValue', paragraph(text));

describe(localizeTimelineModule, () => {
  it('moves the heading block and every item into the default language', () => {
    expect(
      localizeTimelineModule({
        headingBlock: { _type: 'headingBlock', heading: 'How it works' },
        items: [
          {
            _key: 'item-1',
            marker: 'Week 1',
            heading: 'Kick off',
            body: paragraph('The project begins.'),
          },
          { _key: 'item-2', heading: 'Build' },
          { _key: 'item-3', heading: 'Ship', body: paragraph('It goes live.') },
        ],
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'localizedHeadingBlock',
          heading: strings('How it works'),
        }),
      ),
      at(['items', { _key: 'item-1' }, 'marker'], set(strings('Week 1'))),
      at(['items', { _key: 'item-1' }, 'heading'], set(strings('Kick off'))),
      at(
        ['items', { _key: 'item-1' }, 'body'],
        set(paragraphs('The project begins.')),
      ),
      at(['items', { _key: 'item-2' }, 'heading'], set(strings('Build'))),
      at(['items', { _key: 'item-3' }, 'heading'], set(strings('Ship'))),
      at(
        ['items', { _key: 'item-3' }, 'body'],
        set(paragraphs('It goes live.')),
      ),
    ]);
  });

  it('localizes only the items still holding plain text', () => {
    expect(
      localizeTimelineModule({
        items: [
          {
            _key: 'item-1',
            heading: strings('Kick off'),
            body: paragraphs('The project begins.'),
          },
          {
            _key: 'item-2',
            heading: strings('Ship'),
            body: paragraph('Live.'),
          },
        ],
      }),
    ).toEqual([
      at(['items', { _key: 'item-2' }, 'body'], set(paragraphs('Live.'))),
    ]);
  });

  it('is idempotent — an already localized module is left alone', () => {
    expect(
      localizeTimelineModule({
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings('How it works'),
        },
        items: [
          {
            _key: 'item-1',
            marker: strings('Week 1'),
            heading: strings('Kick off'),
            body: paragraphs('The project begins.'),
          },
        ],
      }),
    ).toBeUndefined();
  });

  it('leaves a module without text alone', () => {
    expect(localizeTimelineModule({})).toBeUndefined();
  });
});
