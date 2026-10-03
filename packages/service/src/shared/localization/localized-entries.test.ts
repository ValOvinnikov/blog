import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import {
  localizedEntries,
  localizedProjectedEntries,
} from './localized-entries';

const { EN, NL } = LOCALE_ISO_CODES;

const document = {
  _id: 'doc-1',
  _type: 'module_cta',
  eyebrow: [
    { _key: 'a', language: EN, value: 'Hello' },
    { _key: 'b', language: NL, value: 'Hallo' },
  ],
  content: [
    {
      _key: 'c',
      language: EN,
      value: [
        {
          _type: 'block',
          _key: 'block-1',
          children: [{ _type: 'span', _key: 'span-1', text: 'Hi.' }],
        },
      ],
    },
  ],
};

const eyebrowQuery = q.star
  .filterByType('module_cta')
  .slice(0)
  .project((sub) => ({ eyebrow: localizedEntries(sub, 'eyebrow') }));

const contentQuery = q.star
  .filterByType('module_cta')
  .slice(0)
  .project((sub) => ({
    content: localizedProjectedEntries(sub, 'content', listedTextBlockFragment),
  }));

function run(query: string, root: unknown = document): Promise<unknown> {
  return evaluateGroqExpression(query, [root], undefined, {
    locale: EN,
    defaultLocale: EN,
  });
}

describe(localizedEntries, () => {
  it('returns the language and value of every entry', async () => {
    expect(await run(eyebrowQuery.query)).toEqual({
      eyebrow: [
        { language: EN, value: 'Hello' },
        { language: NL, value: 'Hallo' },
      ],
    });
  });

  it('returns nothing when the field is absent', async () => {
    expect(
      await run(eyebrowQuery.query, { _id: 'doc-1', _type: 'module_cta' }),
    ).toEqual({ eyebrow: null });
  });
});

describe(localizedProjectedEntries, () => {
  it('returns each language with its projected blocks', async () => {
    expect(await run(contentQuery.query)).toMatchObject({
      content: [
        {
          language: EN,
          value: [{ _type: 'block', children: [{ text: 'Hi.' }] }],
        },
      ],
    });
  });
});
