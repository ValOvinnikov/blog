import type { TVoicePortableText } from '@blog/config';
import { faker } from '@faker-js/faker';
import { PortableText } from '@web/components/shared/portable-text';
import { customRender, screen } from '@web/testing/custom-render';

import { voicePortableTextToInlineText } from './voice-portable-text-to-inline-text';

faker.seed(6012);

const MOCK_LINK_TEXT = faker.lorem.word();
const MOCK_LEADING_TEXT = `${faker.lorem.words(2)} `;
const MOCK_TRAILING_TEXT = ` ${faker.lorem.words(2)}.`;
const MOCK_HREF = faker.internet.url();
const MOCK_LINK_KEY = faker.string.uuid();

const MOCK_VOICE_VALUE: TVoicePortableText = [
  {
    _type: 'block',
    _key: faker.string.uuid(),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: faker.string.uuid(),
        text: MOCK_LEADING_TEXT,
        marks: [],
      },
      {
        _type: 'span',
        _key: faker.string.uuid(),
        text: MOCK_LINK_TEXT,
        marks: [MOCK_LINK_KEY],
      },
      {
        _type: 'span',
        _key: faker.string.uuid(),
        text: MOCK_TRAILING_TEXT,
        marks: [],
      },
    ],
    markDefs: [{ _key: MOCK_LINK_KEY, _type: 'link', href: MOCK_HREF }],
  },
];

const setup = customRender(PortableText, {
  value: voicePortableTextToInlineText(MOCK_VOICE_VALUE),
});

describe(voicePortableTextToInlineText, () => {
  beforeEach(() => {
    setup();
  });

  it('produces a value PortableText renders as a working anchor', () => {
    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });

    expect(link).toHaveAttribute('href', MOCK_HREF);
  });
});
