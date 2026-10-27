import { faker } from '@faker-js/faker';

import { escapeXml } from './escape-xml';

faker.seed(109);

const MOCK_TEXT = faker.lorem.sentence();
const [MOCK_FIRST_WORD, MOCK_SECOND_WORD] = faker.helpers.uniqueArray(
  faker.lorem.word,
  2,
);

describe(escapeXml, () => {
  it.each([
    { character: '&', escaped: '&amp;' },
    { character: '<', escaped: '&lt;' },
    { character: '>', escaped: '&gt;' },
    { character: '"', escaped: '&quot;' },
    { character: "'", escaped: '&apos;' },
  ])('escapes $character as $escaped', ({ character, escaped }) => {
    const result = escapeXml(
      `${MOCK_FIRST_WORD}${character}${MOCK_SECOND_WORD}`,
    );

    expect(result).toBe(`${MOCK_FIRST_WORD}${escaped}${MOCK_SECOND_WORD}`);
  });

  it('leaves plain text untouched', () => {
    const result = escapeXml(MOCK_TEXT);

    expect(result).toBe(MOCK_TEXT);
  });

  it('escapes every reserved character in a single pass', () => {
    const result = escapeXml(
      `<${MOCK_FIRST_WORD} a="b">&'</${MOCK_FIRST_WORD}>`,
    );

    expect(result).toBe(
      `&lt;${MOCK_FIRST_WORD} a=&quot;b&quot;&gt;&amp;&apos;&lt;/${MOCK_FIRST_WORD}&gt;`,
    );
  });
});
