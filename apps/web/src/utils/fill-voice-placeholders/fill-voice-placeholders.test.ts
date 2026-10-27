import type { TVoicePortableText } from '@blog/config';
import { faker } from '@faker-js/faker';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';

import { fillVoicePlaceholders } from './fill-voice-placeholders';

faker.seed(113);

const [MOCK_NAME_VALUE, MOCK_PREFIX, MOCK_SUFFIX] = faker.helpers.uniqueArray(
  faker.lorem.word,
  3,
);
const MOCK_UNMATCHED_KEY = 'who';
const MOCK_STRONG_MARK = 'strong';

const textsOf = (value: TVoicePortableText): string[] =>
  value.flatMap((block) => block.children.map(({ text }) => text));

describe(fillVoicePlaceholders, () => {
  it('replaces each placeholder with its param in every block', () => {
    const value = [
      ...mockVoiceRichText(`${MOCK_PREFIX} {name}`),
      ...mockVoiceRichText(`{name} ${MOCK_SUFFIX} {name}`),
    ];

    const result = fillVoicePlaceholders(value, { name: MOCK_NAME_VALUE! });

    expect(textsOf(result)).toEqual([
      `${MOCK_PREFIX} ${MOCK_NAME_VALUE}`,
      `${MOCK_NAME_VALUE} ${MOCK_SUFFIX} ${MOCK_NAME_VALUE}`,
    ]);
  });

  it('leaves a placeholder with no matching param untouched', () => {
    const value = mockVoiceRichText(`${MOCK_PREFIX} {${MOCK_UNMATCHED_KEY}}`);

    const result = fillVoicePlaceholders(value, { name: MOCK_NAME_VALUE! });

    expect(textsOf(result)).toEqual([`${MOCK_PREFIX} {${MOCK_UNMATCHED_KEY}}`]);
  });

  it('keeps the marks on a span it fills', () => {
    const [block] = mockVoiceRichText('{name}');
    const [span] = block!.children;
    const value: TVoicePortableText = [
      { ...block!, children: [{ ...span!, marks: [MOCK_STRONG_MARK] }] },
    ];

    const result = fillVoicePlaceholders(value, { name: MOCK_NAME_VALUE! });

    expect(result[0]?.children[0]).toEqual({
      ...span,
      text: MOCK_NAME_VALUE,
      marks: [MOCK_STRONG_MARK],
    });
  });
});
